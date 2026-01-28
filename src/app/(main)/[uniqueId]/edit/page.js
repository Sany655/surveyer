'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BiPlus, BiTrash, BiSave, BiArrowBack, BiCheckCircle, BiXCircle, BiUpArrowAlt, BiDownArrowAlt } from "react-icons/bi"
import toast from 'react-hot-toast'
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { fetchDivisions, fetchDistricts, fetchUpazillas as fetchUpazilas, fetchUnions } from '@/app/utils/locationApi'
import { LoadingState } from "@/components/ui/spinner"

const QUESTION_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'number', label: 'Number' },
    { value: 'multiple_choice', label: 'Single Choice' },
    { value: 'checkbox', label: 'Multiple Choice' },
    { value: 'long_text', label: 'Long Text' },
    { value: 'date', label: 'Date' }
]

export default function EditSurveyPage() {
    const router = useRouter()
    const { uniqueId: paramId } = useParams()

    // Form States
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasResponses, setHasResponses] = useState(false)
    const [uniqueId, setUniqueId] = useState(paramId)

    // Location States
    const [divisions, setDivisions] = useState([])
    const [districts, setDistricts] = useState([])
    const [upazilas, setUpazilas] = useState([])
    const [unions, setUnions] = useState([])

    const [selectedDivision, setSelectedDivision] = useState()
    const [selectedDistrict, setSelectedDistrict] = useState()
    const [selectedUpazila, setSelectedUpazila] = useState()
    const [selectedUnion, setSelectedUnion] = useState()

    useEffect(() => {
        // Initial Fetch
        fetchDivisions().then(setDivisions)
        fetchSurveyData()
    }, [])

    // --- Fetches ---

    const fetchSurveyData = async () => {
        try {
            const res = await fetch(`/api/surveys/${paramId}/manage`)
            if (!res.ok) throw new Error('Failed to load survey')
            const data = await res.json()

            setTitle(data.title)
            setDescription(data.description)
            setHasResponses(data.responseCount > 0)
            setUniqueId(data.unique_id)

            // Reconstruct questions
            const mappedQuestions = data.questions.map(q => {
                let options = [];
                try {
                    let opts = q.options;
                    // Handle string (JSON) options
                    if (typeof opts === 'string') {
                        try {
                            opts = JSON.parse(opts);
                            // Handle double stringification
                            if (typeof opts === 'string') {
                                opts = JSON.parse(opts);
                            }
                        } catch (e) {
                            console.error("Error parsing options string:", e);
                            opts = [];
                        }
                    }
                    options = Array.isArray(opts) ? opts : [];
                } catch (error) {
                    console.error("Error handling options:", error);
                    options = [];
                }

                let validation = { type: '', operator: '', value: '', value2: '', errorMessage: '' };
                let hasValidation = false;
                if (q.validation) {
                    try {
                        const v = typeof q.validation === 'string' ? JSON.parse(q.validation) : q.validation;
                        if (v && typeof v === 'object') {
                            validation = { ...validation, ...v };
                            hasValidation = true;
                        }
                    } catch (e) {
                        console.error("Error parsing validation:", e);
                    }
                }

                return {
                    id: q.id,
                    text: q.question,
                    type: q.type,
                    options: options,
                    required: q.required,
                    hasValidation,
                    validation
                };
            })
            setQuestions(mappedQuestions)

            // Setup Location Pre-fill
            if (data.division_id) {
                const divId = String(data.division_id)
                setSelectedDivision(divId)
                fetchDistricts(divId).then(setDistricts)
            }
            if (data.district_id) {
                const distId = String(data.district_id)
                setSelectedDistrict(distId)
                fetchUpazilas(distId).then(setUpazilas)
            }
            if (data.upazila_id) {
                const upzId = String(data.upazila_id)
                setSelectedUpazila(upzId)
                fetchUnions(upzId).then(setUnions)
            }
            if (data.union_id) setSelectedUnion(String(data.union_id))

        } catch (error) {
            console.error(error)
            toast.error("Failed to load survey data")
            router.push('/')
        } finally {
            setLoading(false)
        }
    }

    // --- Handlers ---

    const handleDivisionChange = (val) => {
        setSelectedDivision(val)
        setSelectedDistrict('')
        setSelectedUpazila('')
        setSelectedUnion('')
        setDistricts([])
        setUpazilas([])
        setUnions([])
        fetchDistricts(val).then(setDistricts)
    }

    const handleDistrictChange = (val) => {
        setSelectedDistrict(val)
        setSelectedUpazila('')
        setSelectedUnion('')
        setUpazilas([])
        setUnions([])
        fetchUpazilas(val).then(setUpazilas)
    }

    const handleUpazilaChange = (val) => {
        setSelectedUpazila(val)
        setSelectedUnion('')
        setUnions([])
        fetchUnions(val).then(setUnions)
    }

    const addQuestion = () => {
        setQuestions([...questions, {
            id: null,
            text: '',
            type: 'text',
            options: [],
            required: true,
            hasValidation: false,
            validation: { type: '', operator: '', value: '', value2: '', errorMessage: '' }
        }])
        if (window) {
            window.scrollTo({
                top: document.body.scrollHeight + 100,
                behavior: 'smooth'
            })
        }
    }

    const removeQuestion = (index) => {
        const newQ = [...questions]
        newQ.splice(index, 1)
        setQuestions(newQ)
    }

    const updateQuestion = (index, field, value) => {
        const newQ = [...questions]
        // Reset validation when type changes
        if (field === 'type') {
            newQ[index] = {
                ...newQ[index],
                [field]: value,
                hasValidation: false,
                validation: { type: '', operator: '', value: '', value2: '', errorMessage: '' }
            }
        } else {
            newQ[index] = { ...newQ[index], [field]: value }
        }
        setQuestions(newQ)
    }

    const addOption = (qIndex) => {
        const newQ = [...questions]
        const question = { ...newQ[qIndex] }

        let currentOptions = Array.isArray(question.options) ? [...question.options] : []
        currentOptions.push('')

        question.options = currentOptions
        newQ[qIndex] = question
        setQuestions(newQ)
    }

    const updateOption = (qIndex, oIndex, value) => {
        const newQ = [...questions]
        const question = { ...newQ[qIndex] }
        const newOptions = [...(question.options || [])]

        newOptions[oIndex] = value
        question.options = newOptions
        newQ[qIndex] = question
        setQuestions(newQ)
    }

    const removeOption = (qIndex, oIndex) => {
        const newQ = [...questions]
        const question = { ...newQ[qIndex] }
        const newOptions = [...(question.options || [])]

        newOptions.splice(oIndex, 1)
        question.options = newOptions
        newQ[qIndex] = question
        setQuestions(newQ)
    }

    const moveQuestionUp = (index) => {
        if (index === 0) return
        const newQuestions = [...questions]
        const temp = newQuestions[index]
        newQuestions[index] = newQuestions[index - 1]
        newQuestions[index - 1] = temp
        setQuestions(newQuestions)
    }

    const moveQuestionDown = (index) => {
        if (index === questions.length - 1) return
        const newQuestions = [...questions]
        const temp = newQuestions[index]
        newQuestions[index] = newQuestions[index + 1]
        newQuestions[index + 1] = temp
        setQuestions(newQuestions)
    }

    const updateValidation = (index, field, value) => {
        const newQ = [...questions]
        newQ[index] = {
            ...newQ[index],
            validation: {
                ...newQ[index].validation,
                [field]: value
            }
        }
        setQuestions(newQ)
    }

    const toggleValidation = (index) => {
        const newQ = [...questions]
        const q = newQ[index]
        let defaultValidation = { type: '', operator: '', value: '', value2: '', errorMessage: '' };

        if (!q.hasValidation) { // Turning ON
            if (q.type === 'number') {
                defaultValidation = { type: 'number', operator: 'GT', value: '', errorMessage: '' };
            } else if (q.type === 'text' || q.type === 'long_text') {
                defaultValidation = { type: 'text', operator: 'CONTAINS', value: '', errorMessage: '' };
            } else if (q.type === 'checkbox') {
                defaultValidation = { type: 'select', operator: 'MIN', value: '1', errorMessage: '' };
            }
        }

        newQ[index] = {
            ...q,
            hasValidation: !q.hasValidation,
            validation: !q.hasValidation ? defaultValidation : q.validation
        }
        setQuestions(newQ)
    }

    const handleUpdate = async (statusOverride = null) => {
        // Validation
        if (!title.trim()) {
            toast.error("Title is required")
            return
        }
        if (questions.length === 0) {
            toast.error("At least one question is required")
            return
        }
        if (questions.some(q => !q.text.trim())) {
            toast.error("All questions must have a text")
            return
        }

        // Check options for multiple choice / checkbox
        const questionsWithInvalidOptions = questions.filter(q =>
            (q.type === 'multiple_choice' || q.type === 'checkbox') &&
            (!q.options || q.options.filter(o => o && o.trim()).length < 2)
        );

        if (questionsWithInvalidOptions.length > 0) {
            toast.error("Multiple choice/checkbox questions must have at least 2 valid options");
            return;
        }

        setSaving(true)
        try {
            const finalStatus = statusOverride !== null ? statusOverride : 1

            const payload = {
                title,
                description,
                location: {
                    division: selectedDivision || null,
                    district: selectedDistrict || null,
                    upazila: selectedUpazila || null,
                    union: selectedUnion || null
                },
                questions: questions.map(q => ({
                    id: q.id,
                    question: q.text,
                    type: q.type,
                    // Filter empty options
                    options: (q.type === 'multiple_choice' || q.type === 'checkbox')
                        ? (q.options ? q.options.filter(o => o && o.trim()) : [])
                        : null,
                    required: q.required,
                    validation: q.validation ? JSON.stringify(q.validation) : null
                })),
                status: finalStatus
            }

            const res = await fetch(`/api/surveys/${uniqueId}/manage`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message || 'Failed to update survey')

            toast.success("Survey Updated Successfully!")
            router.push('/')

        } catch (error) {
            console.error(error)
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        loading ? (
            <LoadingState message="Loading Survey Data..." />
        ) : (
            <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Survey</h1>
                        <p className="text-muted-foreground">Modify your survey</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="destructive" disabled={saving} onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={() => handleUpdate(0)} disabled={saving}>
                            {saving ? "Saving..." : "Save as Draft"}
                        </Button>
                        <Button onClick={() => handleUpdate(1)} disabled={saving}>
                            {saving ? "Saving..." : "Publish"}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Survey Title</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Community Health Survey" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the purpose..." />
                        </div>

                        {/* Location Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Division</Label>
                                <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                                    <SelectTrigger><SelectValue placeholder="Select Division" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem>Select Division</SelectItem>
                                        {divisions.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>District</Label>
                                <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={!selectedDivision}>
                                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem>Select District</SelectItem>
                                        {districts.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Upazila</Label>
                                <Select value={selectedUpazila} onValueChange={handleUpazilaChange} disabled={!selectedDistrict}>
                                    <SelectTrigger><SelectValue placeholder="Select Upazila" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem>Select Upazila</SelectItem>
                                        {upazilas.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Union</Label>
                                <Select value={selectedUnion} onValueChange={(v) => setSelectedUnion(v)} disabled={!selectedUpazila}>
                                    <SelectTrigger><SelectValue placeholder="Select Union" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem>Select Union</SelectItem>
                                        {unions.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Questions</h2>
                        <Button onClick={addQuestion} variant="outline"><BiPlus className="mr-2" /> Add Question</Button>
                    </div>

                    {/* {hasResponses && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        This survey has collected responses. Editing questions is disabled to preserve data integrity.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )} */}

                    {(questions || []).map((q, qIdx) => (
                        <Card key={qIdx} className="relative">
                            <div className="absolute top-2 right-2 flex items-center bg-white/80 rounded-md shadow-sm">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => moveQuestionUp(qIdx)}
                                    title="Move Up"
                                >
                                    <BiUpArrowAlt size={20} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => moveQuestionDown(qIdx)}
                                    title="Move Down"
                                >
                                    <BiDownArrowAlt size={20} />
                                </Button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    // disabled={hasResponses && q.id}
                                    onClick={() => removeQuestion(qIdx)}
                                >
                                    <BiTrash />
                                </Button>
                            </div>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label>Question Text</Label>
                                        <Input
                                            value={q.text}
                                            onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                                            placeholder="Enter question..."
                                        // disabled={hasResponses && q.id}
                                        />
                                    </div>
                                    <div className="w-[200px] space-y-2">
                                        <Label>Type</Label>
                                        <Select value={q.type} onValueChange={(v) => updateQuestion(qIdx, 'type', v)} /* disabled={hasResponses && q.id} */>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {QUESTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                                    <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase">Options</Label>
                                        {Array.isArray(q.options) && q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex gap-2">
                                                <Input
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                    className="h-8 text-sm"
                                                // disabled={hasResponses && q.id}
                                                />
                                                {/* {(!hasResponses || !q.id) && ( */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-400"
                                                    onClick={() => removeOption(qIdx, oIdx)}
                                                // disabled={hasResponses && q.id}
                                                >
                                                    <BiTrash size={14} />
                                                </Button>
                                                {/* )} */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(q.type === 'multiple_choice' || q.type === 'checkbox') && /* (!hasResponses || !q.id) && */ (
                                    <Button size="sm" variant="ghost" onClick={() => addOption(qIdx)} className="text-xs">
                                        + Add Option
                                    </Button>
                                )}

                                {/* Advanced Validation Rules */}
                                {q.hasValidation && (
                                    <div className="p-4 bg-muted/30 rounded-md space-y-3 border border-dashed border-muted-foreground/30">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold uppercase text-primary">Response Validation</Label>
                                            {/* (!hasResponses || !q.id) && */} <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => toggleValidation(qIdx)}>Remove</Button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {/* Validation Type Selector */}
                                            <div className="w-full sm:w-[140px]">
                                                <Select
                                                    value={q.validation?.type}
                                                    onValueChange={(val) => {
                                                        updateValidation(qIdx, 'type', val);
                                                        updateValidation(qIdx, 'operator', '');
                                                    }}
                                                // disabled={hasResponses && q.id}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(q.type === 'text' || q.type === 'long_text') && (
                                                            <>
                                                                <SelectItem value="number">Number</SelectItem>
                                                                <SelectItem value="text">Text</SelectItem>
                                                                <SelectItem value="length">Length</SelectItem>
                                                                <SelectItem value="regex">Regular Expression</SelectItem>
                                                            </>
                                                        )}
                                                        {q.type === 'number' && (
                                                            <SelectItem value="number">Number</SelectItem>
                                                        )}
                                                        {q.type === 'checkbox' && (
                                                            <SelectItem value="select">Select at least/most</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Operator Selector */}
                                            <div className="w-full sm:w-[140px]">
                                                <Select
                                                    value={q.validation?.operator}
                                                    onValueChange={(val) => updateValidation(qIdx, 'operator', val)}
                                                // disabled={hasResponses && q.id}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Operator" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {q.validation?.type === 'number' && (
                                                            <>
                                                                <SelectItem value="GT">Greater than</SelectItem>
                                                                <SelectItem value="GTE">Greater than or equal to</SelectItem>
                                                                <SelectItem value="LT">Less than</SelectItem>
                                                                <SelectItem value="LTE">Less than or equal to</SelectItem>
                                                                <SelectItem value="EQ">Equal to</SelectItem>
                                                                <SelectItem value="NEQ">Not equal to</SelectItem>
                                                                <SelectItem value="BETWEEN">Between</SelectItem>
                                                                <SelectItem value="NOT_BETWEEN">Not between</SelectItem>
                                                                <SelectItem value="IS_NUMBER">Is number</SelectItem>
                                                                <SelectItem value="WHOLE_NUMBER">Whole number</SelectItem>
                                                            </>
                                                        )}
                                                        {q.validation?.type === 'text' && (
                                                            <>
                                                                <SelectItem value="CONTAINS">Contains</SelectItem>
                                                                <SelectItem value="NOT_CONTAINS">Does not contain</SelectItem>
                                                                <SelectItem value="EMAIL">Email address</SelectItem>
                                                                <SelectItem value="URL">URL</SelectItem>
                                                            </>
                                                        )}
                                                        {q.validation?.type === 'length' && (
                                                            <>
                                                                <SelectItem value="MAX_CHARS">Maximum character count</SelectItem>
                                                                <SelectItem value="MIN_CHARS">Minimum character count</SelectItem>
                                                            </>
                                                        )}
                                                        {q.validation?.type === 'regex' && (
                                                            <>
                                                                <SelectItem value="MATCHES">Matches</SelectItem>
                                                                <SelectItem value="NOT_MATCHES">Doesn't match</SelectItem>
                                                            </>
                                                        )}
                                                        {q.validation?.type === 'select' && (
                                                            <>
                                                                <SelectItem value="MIN">Select at least</SelectItem>
                                                                <SelectItem value="MAX">Select at most</SelectItem>
                                                                <SelectItem value="EXACT">Select exactly</SelectItem>
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Values Inputs */}
                                            {/* Hide value inputs for some operators */}
                                            {!['IS_NUMBER', 'WHOLE_NUMBER', 'EMAIL', 'URL'].includes(q.validation?.operator) && (
                                                <div className="flex-1 flex gap-2">
                                                    <Input
                                                        className="h-8 text-xs"
                                                        placeholder={
                                                            q.validation?.type === 'regex' ? 'Pattern' : 'Number/Text'
                                                        }
                                                        value={q.validation?.value}
                                                        onChange={(e) => updateValidation(qIdx, 'value', e.target.value)}
                                                    // disabled={hasResponses && q.id}
                                                    />
                                                    {['BETWEEN', 'NOT_BETWEEN'].includes(q.validation?.operator) && (
                                                        <Input
                                                            className="h-8 text-xs"
                                                            placeholder="Max"
                                                            value={q.validation?.value2}
                                                            onChange={(e) => updateValidation(qIdx, 'value2', e.target.value)}
                                                        // disabled={hasResponses && q.id}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Error Message */}
                                        <div>
                                            <Input
                                                className="h-8 text-xs"
                                                placeholder="Custom error text"
                                                value={q.validation?.errorMessage}
                                                onChange={(e) => updateValidation(qIdx, 'errorMessage', e.target.value)}
                                            // disabled={hasResponses && q.id}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-muted-foreground flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={q.required}
                                                onChange={(e) => updateQuestion(qIdx, 'required', e.target.checked)}
                                                // disabled={hasResponses && q.id}
                                                className="h-4 w-4 bg-background border-input rounded ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            />
                                            Required
                                        </label>
                                    </div>

                                    {/* Simple Validation Toggle Button */}
                                    {['text', 'number', 'checkbox', 'long_text'].includes(q.type) && /* (!hasResponses || !q.id) && */ (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs gap-1"
                                            onClick={() => toggleValidation(qIdx)}
                                        >
                                            {q.hasValidation ? (
                                                <><BiXCircle className="text-destructive" /> Remove Validation</>
                                            ) : (
                                                <><BiCheckCircle /> Add Validation</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div >
        )
    )
}
