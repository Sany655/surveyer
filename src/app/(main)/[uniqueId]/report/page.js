'use strict';
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell,
    PieChart, Pie, AreaChart, Area
} from 'recharts'
import { BiArrowBack } from "react-icons/bi"
import 'leaflet/dist/leaflet.css'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { LoadingState } from "@/components/ui/spinner"
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Heatmap Color Scale
const HEATMAP_COLORS = {
    0: 'bg-slate-50',
    1: 'bg-blue-50',
    2: 'bg-blue-100',
    3: 'bg-blue-200',
    4: 'bg-blue-300',
    5: 'bg-blue-400',
    6: 'bg-blue-500 text-white',
    7: 'bg-blue-600 text-white',
    8: 'bg-blue-700 text-white',
};

const getColorIntensity = (value, max) => {
    if (!max || value === 0) return 0;
    const ratio = value / max;
    if (ratio < 0.1) return 1;
    if (ratio < 0.25) return 2;
    if (ratio < 0.4) return 3;
    if (ratio < 0.55) return 4;
    if (ratio < 0.7) return 5;
    if (ratio < 0.85) return 6;
    return 8;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// Helper to update map bounds
function MapUpdater({ locations }) {
    const map = useMap();
    useEffect(() => {
        if (locations && locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [locations, map]);
    return null;
}

// Helper to count word frequency (simple implementation)
const getWordFrequency = (texts) => {
    if (!texts || !Array.isArray(texts)) return [];
    const words = {};
    texts.forEach(text => {
        if (!text) return;
        const tokenizer = text.toLowerCase().match(/\b\w+\b/g);
        if (tokenizer) {
            tokenizer.forEach(word => {
                if (word.length > 3) { // Filter small words
                    words[word] = (words[word] || 0) + 1;
                }
            });
        }
    });
    return Object.entries(words)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 words
}

export default function SurveyReport() {
    const { uniqueId } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    // Cross-Tab State
    const [rowQ, setRowQ] = useState(null)
    const [colQ, setColQ] = useState(null)

    // Map State
    const [mapMode, setMapMode] = useState('markers') // 'markers' | 'heatmap'

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`/api/surveys/${uniqueId}/analytics`)
            if (!res.ok) throw new Error('Failed to load analytics')
            const result = await res.json()
            setData(result)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load report")
        } finally {
            setLoading(false)
        }
    }

    // Prepare Cross-Tab Data
    const crossTabData = useMemo(() => {
        if (!data || !data.rawResponses || !rowQ || !colQ) return null;

        const matrix = {};
        const rowQuestion = data.questions.find(q => q.id.toString() === rowQ);
        const colQuestion = data.questions.find(q => q.id.toString() === colQ);

        if (!rowQuestion || !colQuestion) return null;

        // Get unique options/values for headers
        // For simplicity, using the aggregated data keys if available, otherwise extracting from raw responses might be needed for open text
        // Let's assume categorical questions for heatmaps (most common use case)

        const getValues = (qId) => {
            const q = data.questions.find(quest => quest.id.toString() === qId.toString());
            // Extract keys from the pre-calculated charts which hold the categories
            if (q.data && Array.isArray(q.data)) return q.data.map(d => d.name);
            if (q.data && q.data.chart) return q.data.chart.map(d => d.name); // Number ranges often in chart
            return [];
        };

        const rowValues = getValues(rowQ);
        const colValues = getValues(colQ);
        let maxCount = 0;

        // items to iterate
        data.rawResponses.forEach(res => {
            if (!res.answers) return;

            // Find answer for row Q
            const ansRow = res.answers.find(a => a.question_id.toString() === rowQ);
            const ansCol = res.answers.find(a => a.question_id.toString() === colQ);

            if (!ansRow || !ansCol) return;

            // Normalize values (handle arrays for checkboxes)
            const getNormVal = (ans) => {
                if (ans.answer_json && Array.isArray(ans.answer_json)) return ans.answer_json;
                return [ans.answer_text || (ans.answer_json ? String(ans.answer_json) : null)];
            };

            const rVals = getNormVal(ansRow);
            const cVals = getNormVal(ansCol);

            rVals.forEach(r => {
                cVals.forEach(c => {
                    if (!r || !c) return;
                    if (!matrix[r]) matrix[r] = {};
                    if (!matrix[r][c]) matrix[r][c] = 0;
                    matrix[r][c]++;
                    if (matrix[r][c] > maxCount) maxCount = matrix[r][c];
                });
            });
        });

        // Ensure all known categories exist in matrix for display
        // (Optional: filter out empty ones? No, heatmap usually shows zeros)

        return { matrix, rowValues, colValues, maxCount, rowLabel: rowQuestion.question, colLabel: colQuestion.question };

    }, [data, rowQ, colQ]);

    const eligibleQuestions = data?.questions.filter(q => ['multiple_choice', 'checkbox', 'number'].includes(q.type)) || [];

    const center = [23.8103, 90.4125]; // Default center

    return (
        <>
            {loading ? (
                <LoadingState message="Loading Analytics Report..." />
            ) : !data ? (
                <div className="p-8 text-center text-red-500">Error loading data.</div>
            ) : (
                <div className="container mx-auto p-4 md:p-6 space-y-8 bg-gray-50/50 min-h-screen">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                                    <BiArrowBack className="text-xl" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{data.survey.title}</h1>
                                <p className="text-muted-foreground text-sm">Comprehensive Analytics Report</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-center">
                                <span className="block text-xs text-muted-foreground uppercase font-semibold">Responses</span>
                                <span className="text-2xl font-bold text-primary">{data.totalResponses}</span>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-center">
                                <span className="block text-xs text-muted-foreground uppercase font-semibold">Completion</span>
                                <span className="text-2xl font-bold text-green-600">100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Map Section */}
                    <Card className="border-0 shadow-md ring-1 ring-gray-200 overflow-hidden">
                        <CardHeader className="bg-white border-b pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <span>Geographic Distribution</span>
                            </CardTitle>
                            <CardDescription>Real-time location data of survey participants</CardDescription>
                            <div className="absolute top-4 right-4 z-10 bg-white shadow-sm rounded-md border flex">
                                <button
                                    onClick={() => setMapMode('markers')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors ${mapMode === 'markers' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-50'}`}
                                >
                                    Markers
                                </button>
                                <div className="w-px bg-border"></div>
                                <button
                                    onClick={() => setMapMode('heatmap')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors ${mapMode === 'heatmap' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-50'}`}
                                >
                                    Heatmap
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 h-[400px] relative">
                            <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                {data.locations.map((loc, idx) => (
                                    <CircleMarker
                                        key={idx}
                                        center={[loc.latitude, loc.longitude]}
                                        // Heatmap Logic: larger radius, lower opacity, overlapping creates intensity
                                        radius={mapMode === 'heatmap' ? 20 : 8}
                                        fillOpacity={mapMode === 'heatmap' ? 0.2 : 0.6}
                                        stroke={mapMode === 'markers'} // No stroke for heatmap mode
                                        weight={2}
                                        color="#ffffff"
                                        fillColor={mapMode === 'heatmap' ? '#ef4444' : '#ef4444'}
                                    >
                                        <Popup className="text-center">
                                            <span className="font-semibold text-sm">Response #{idx + 1}</span>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                                <MapUpdater locations={data.locations} />
                            </MapContainer>
                        </CardContent>
                    </Card>

                    {/* Questions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        {data.questions.map((q, index) => {
                            // Determine grid span for larger items (Word clouds or large number charts)
                            const isWide = q.type === 'text' || q.type === 'long_text';

                            return (
                                <Card key={q.id} className={`border-0 shadow-md ring-1 ring-gray-200 flex flex-col ${isWide ? 'md:col-span-2' : ''}`}>
                                    <CardHeader className="bg-white border-b pb-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                                                    {q.type.replace(/_/g, ' ')}
                                                </span>
                                                <CardTitle className="text-lg font-semibold leading-tight text-gray-800">
                                                    {index + 1}. {q.question}
                                                </CardTitle>
                                            </div>
                                            <div className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-slate-50 px-2 py-1 rounded">
                                                {q.total} Answered
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-6 bg-white">

                                        {/* CHECKBOX / BAR CHART (Vertical Layout for readability) */}
                                        {(q.type === 'checkbox' || q.type === 'date') && q.data.length > 0 && (
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        layout="vertical"
                                                        data={q.data}
                                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            width={150}
                                                            tick={({ x, y, payload }) => {
                                                                let text = payload.value;
                                                                // Try to parse JSON array string if applicable
                                                                try {
                                                                    if (text.startsWith('[') && text.endsWith(']')) {
                                                                        const parsed = JSON.parse(text);
                                                                        if (Array.isArray(parsed)) text = parsed.join(', ');
                                                                    }
                                                                    // Clean up "Option" quotes if pseudo-JSON
                                                                    text = text.replace(/"/g, '');
                                                                } catch (e) { }

                                                                // Truncate long text
                                                                const maxLength = 25;
                                                                const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

                                                                return (
                                                                    <g transform={`translate(${x},${y})`}>
                                                                        <text x={0} y={0} dy={4} textAnchor="end" fill="#666" fontSize={12} title={text}>
                                                                            {truncated}
                                                                        </text>
                                                                    </g>
                                                                );
                                                            }}
                                                        />
                                                        <RechartsTooltip
                                                            cursor={{ fill: 'transparent' }}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                            formatter={(value, name, props) => [value, 'Count']}
                                                            labelFormatter={(label) => {
                                                                try {
                                                                    if (typeof label === 'string' && label.startsWith('[') && label.endsWith(']')) {
                                                                        const parsed = JSON.parse(label);
                                                                        if (Array.isArray(parsed)) return parsed.join(', ');
                                                                    }
                                                                    return label.replace(/"/g, '');
                                                                } catch (e) { }
                                                                return label;
                                                            }}
                                                        />
                                                        <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                                            {q.data.map((entry, idx) => (
                                                                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* MULTIPLE CHOICE / DONUT CHART */}
                                        {q.type === 'multiple_choice' && q.data.length > 0 && (
                                            <div className="h-[300px] w-full flex items-center justify-center">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={q.data}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={2}
                                                            fill="#8884d8"
                                                        >
                                                            {q.data.map((entry, idx) => (
                                                                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* NUMBER / AREA CHART + STATS */}
                                        {q.type === 'number' && typeof q.data === 'object' && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                        <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Average</p>
                                                        <p className="text-2xl font-black text-gray-800">{q.data.average}</p>
                                                    </div>
                                                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                                        <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Low</p>
                                                        <p className="text-2xl font-black text-gray-800">{q.data.min}</p>
                                                    </div>
                                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                                        <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1">High</p>
                                                        <p className="text-2xl font-black text-gray-800">{q.data.max}</p>
                                                    </div>
                                                </div>

                                                {q.data.chart && q.data.chart.length > 0 && (
                                                    <div className="h-[250px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={q.data.chart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id={`colorValue-${q.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                                <Area type="monotone" dataKey="value" stroke="#82ca9d" fillOpacity={1} fill={`url(#colorValue-${q.id})`} />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TEXT / WORD CLOUD + LIST */}
                                        {(q.type === 'text' || q.type === 'long_text') && Array.isArray(q.data) && (
                                            <div className="space-y-6">
                                                {/* Simple Word Frequency Chart if data exists */}
                                                {q.data.length > 0 && (
                                                    <div className="h-[200px] w-full">
                                                        <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Frequent Words</h4>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={getWordFrequency(q.data)} layout="vertical" margin={{ left: 40 }}>
                                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                                                <XAxis type="number" hide />
                                                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                                                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                                                <Bar dataKey="value" fill="#8884d8" barSize={20} radius={[0, 4, 4, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Responses</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {q.data.length === 0 ? (
                                                            <p className="text-zinc-400 italic">No text answers yet.</p>
                                                        ) : (
                                                            q.data.slice(0, 9).map((text, i) => (
                                                                <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-gray-700 italic relative">
                                                                    <span className="absolute top-2 left-2 text-3xl leading-none text-slate-200 font-serif">"</span>
                                                                    <p className="relative z-10 pt-2 pl-2">{text}</p>
                                                                </div>
                                                            ))
                                                        )}
                                                        {q.data.length > 9 && (
                                                            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed">
                                                                +{q.data.length - 9} more...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Advanced Analysis: Cross-Tab Heatmap */}
                    <Card className="border-0 shadow-md ring-1 ring-gray-200">
                        <CardHeader className="bg-white border-b pb-4">
                            <CardTitle>Cross-Analysis Heatmap</CardTitle>
                            <CardDescription>Analyze correlations between two questions</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Row Question (Y-Axis)</label>
                                    <Select onValueChange={setRowQ} value={rowQ || ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Question" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eligibleQuestions.map(q => (
                                                <SelectItem key={q.id} value={q.id.toString()}>
                                                    {q.question}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Column Question (X-Axis)</label>
                                    <Select onValueChange={setColQ} value={colQ || ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Question" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eligibleQuestions.map(q => (
                                                <SelectItem key={q.id} value={q.id.toString()}>
                                                    {q.question}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {crossTabData ? (
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[200px] bg-slate-50 font-bold">{crossTabData.rowLabel} \ {crossTabData.colLabel}</TableHead>
                                                {crossTabData.colValues.map((colVal, idx) => (
                                                    <TableHead key={idx} className="text-center font-semibold bg-slate-50 min-w-[100px]">{colVal}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {crossTabData.rowValues.map((rowVal, rIdx) => (
                                                <TableRow key={rIdx}>
                                                    <TableCell className="font-medium bg-slate-50">{rowVal}</TableCell>
                                                    {crossTabData.colValues.map((colVal, cIdx) => {
                                                        const count = crossTabData.matrix[rowVal]?.[colVal] || 0;
                                                        return (
                                                            <TableCell key={cIdx} className="p-0">
                                                                <div className={`w-full h-12 flex items-center justify-center text-sm ${HEATMAP_COLORS[getColorIntensity(count, crossTabData.maxCount)]}`}>
                                                                    {count > 0 ? count : ''}
                                                                </div>
                                                            </TableCell>
                                                        )
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                                    {!rowQ || !colQ ? "Please select two questions to view the analysis" : "No correlation data available for these questions"}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    )
}
