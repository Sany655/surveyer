'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { fetchDivisions, fetchDistricts, fetchUpazillas, fetchUnions } from "@/app/utils/locationApi"
import toast from "react-hot-toast"
import { LoadingState } from "@/components/ui/spinner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BiPlus, BiTrash, BiSave, BiSend, BiDotsVerticalRounded, BiCheckCircle, BiXCircle, BiUpArrowAlt, BiDownArrowAlt } from "react-icons/bi"
import { Spinner } from "@/components/ui/spinner"

// ... (other imports remain, but I will overwrite the whole file content structure to be safe with indentation/imports)
// Actually, I can target the function body if I am careful. But wrapping everything in Tabs requires significant structure change.
// I will rewrite the component body to be safe.

function QuestionaireContent() {
    const router = useRouter()
    // Form Basic Info
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [activeTab, setActiveTab] = useState('manual')

    // AI Generation State
    const [aiPrompt, setAiPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    // Location State
    const [division, setDivision] = useState('1')
    const [district, setDistrict] = useState('8')
    const [upazila, setUpazila] = useState('')
    const [union, setUnion] = useState('')

    // Location Options State
    const [divisions, setDivisions] = useState([])
    const [districts, setDistricts] = useState([])
    const [upazilas, setUpazilas] = useState([])
    const [unions, setUnions] = useState([])

    // Questions State
    const [questions, setQuestions] = useState([
        {
            text: '',
            type: 'text',
            required: true,
            options: [],
            hasValidation: false,
            validation: { type: '', operator: '', value: '', value2: '', errorMessage: '' }
        }
    ])

    // ... (Location useEffects - I will keep them but need to ensure they are inside the component)
    // To make this edit efficient and robust, I will REPLACE the whole function body logic related to RETURN

    // Load Districts when Division changes
    useEffect(() => {
        if (division) {
            fetchDistricts(division).then(setDistricts)
            setDistrict('')
            setUpazila('')
            setUnion('')
            setUpazilas([])
            setUnions([])
        } else {
            setDistricts([])
            setDistrict('')
            setUpazila('')
            setUnion('')
        }
    }, [division])

    // Load Divisions
    useEffect(() => {
        fetchDivisions().then(setDivisions)
    }, [])

    // Load Upazilas when District changes
    useEffect(() => {
        if (district) {
            fetchUpazillas(district).then(setUpazilas)
            setUpazila('')
            setUnion('')
            setUnions([])
        } else {
            setUpazilas([])
            setUpazila('')
            setUnion('')
        }
    }, [district])

    // Load Unions when Upazila changes
    useEffect(() => {
        if (upazila) {
            fetchUnions(upazila).then(setUnions)
            setUnion('')
        } else {
            setUnions([])
            setUnion('')
        }
    }, [upazila])

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                text: '',
                type: 'text',
                required: true,
                options: [],
                hasValidation: false,
                validation: { type: '', operator: '', value: '', value2: '', errorMessage: '' }
            }
        ])
        if (window) {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            })
        }
    }

    const handleRemoveQuestion = (index) => {
        setQuestions(questions.filter((q, qIndex) => qIndex !== index))
    }

    const updateQuestion = (index, field, value) => {
        setQuestions(questions.map((q, qIndex) => {
            if (qIndex === index) {
                // Reset validation when type changes
                if (field === 'type') {
                    return {
                        ...q,
                        [field]: value,
                        hasValidation: false,
                        validation: { type: '', operator: '', value: '', value2: '', errorMessage: '' }
                    }
                }
                return { ...q, [field]: value }
            }
            return q
        }))
    }

    const addOption = (index) => {
        setQuestions(questions.map((q, qIndex) => {
            if (qIndex === index) {
                return { ...q, options: [...q.options, ''] }
            }
            return q
        }))
    }

    const updateOption = (index, optionIndex, value) => {
        setQuestions(questions.map((q, qIndex) => {
            if (qIndex === index) {
                const newOptions = [...q.options]
                newOptions[optionIndex] = value
                return { ...q, options: newOptions }
            }
            return q
        }))
    }

    const updateValidation = (index, field, value) => {
        setQuestions(questions.map((q, qIndex) => {
            if (qIndex === index) {
                return {
                    ...q,
                    validation: {
                        ...q.validation,
                        [field]: value
                    }
                }
            }
            return q
        }))
    }

    const toggleValidation = (index) => {
        setQuestions(questions.map((q, qIndex) => {
            if (qIndex === index) {
                // Set default validation type based on question type
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

                return {
                    ...q,
                    hasValidation: !q.hasValidation,
                    validation: !q.hasValidation ? defaultValidation : q.validation
                }
            }
            return q
        }))
    }

    const removeOption = (index, optionIndex) => {
        setQuestions(questions.map((q, qIndex) => {
            if (qIndex === index) {
                return { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
            }
            return q
        }))
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

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) {
            toast.error("Please enter a description for your survey");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("Generating survey with AI...");

        try {
            const res = await fetch('/api/surveys/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt })
            });

            const data = await res.json();

            if (!res.ok) {
                let msg = data.message || 'Failed to generate survey';

                // Try to parse if msg is a JSON string (often happens with some upstream API errors)
                if (typeof msg === 'string' && (msg.startsWith('{') || msg.startsWith('['))) {
                    try {
                        const parsed = JSON.parse(msg);
                        // Check for nested error objects common in AI providers
                        if (parsed.error && parsed.error.message) {
                            msg = parsed.error.message;
                        } else if (parsed.message) {
                            msg = parsed.message;
                        }
                    } catch (e) {
                        // ignore parse error, use original string
                    }
                }

                // Friendly override for known technical errors
                if (msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('unauthorized')) {
                    msg = "AI Service Unavailable: Please check API configuration.";
                }

                // If it's a quota error with a huge details dump, simplify it
                if (data.details && (typeof data.details === 'string') && data.details.includes('Quota exceeded')) {
                    // Try to finding specific retry time if available in the text
                    const retryMatch = data.details.match(/Please retry in ([0-9.]+)s/);
                    if (retryMatch) {
                        msg = `Quota exceeded. Please retry in ${Math.ceil(parseFloat(retryMatch[1]))} seconds.`;
                    } else {
                        msg = "AI Usage Limit Exceeded. Please try again in a minute.";
                    }
                } else if (data.details) {
                    // Check if data.details is also a JSON object/string that needs parsing
                    // validation errors often come here
                }

                throw new Error(msg);
            }

            // Populate state with generated data
            setTitle(data.title || "Generated Survey");
            setDescription(data.description || "");

            if (data.questions && Array.isArray(data.questions)) {
                const formattedQuestions = data.questions.map(q => ({
                    text: q.text || "Question",
                    type: q.type || 'text',
                    required: q.required !== undefined ? q.required : true,
                    options: q.options || [],
                    hasValidation: false,
                    validation: { type: '', operator: '', value: '', value2: '', errorMessage: '' }
                }));
                setQuestions(formattedQuestions);
            }

            toast.success("Survey generated successfully!", { id: toastId });
            setActiveTab('manual'); // Switch to manual tab for review

        } catch (error) {
            console.error(error);
            toast.error(error.message, { id: toastId, duration: 6000 });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (status = 1) => {
        if (!title.trim()) {
            toast.error("Survey title is required")
            return
        }
        if (questions.some(q => !q.text.trim())) {
            toast.error("All questions must have a text")
            return
        }
        // Check options for multiple choice / checkbox
        const invalidOptions = questions.some(q =>
            (q.type === 'multiple_choice' || q.type === 'checkbox') &&
            (q.options.length < 2 || q.options.some(opt => !opt.trim()))
        )
        if (invalidOptions) {
            toast.error("Multiple choice/checkbox questions must have at least 2 valid options")
            return
        }

        const toastId = toast.loading("Saving survey...")

        try {
            const payload = {
                title,
                description,
                location: {
                    division: division || null,
                    district: district || null,
                    upazila: upazila || null,
                    union: union || null
                },
                questions: questions.map(q => ({
                    question: q.text,
                    type: q.type,
                    options: (q.type === 'multiple_choice' || q.type === 'checkbox') ? JSON.stringify(q.options) : null,
                    required: q.required,
                    validation: q.hasValidation ? JSON.stringify(q.validation) : null
                })),
                status: status
            }

            const res = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message || 'Failed to create survey')

            toast.success(status === 1 ? "Survey Published!" : "Survey Saved as Draft!", { id: toastId })

            // Redirect based on action
            router.push('/')

        } catch (error) {
            console.error(error)
            toast.error(error.message, { id: toastId })
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Survey</h1>
                <div className="flex gap-2">
                    {/* Show Save/Publish buttons only on Manual tab or if questions exist */}
                    {activeTab === 'manual' && (
                        <>
                            <Button variant="outline" onClick={() => handleSubmit(0)}>
                                Save as Draft
                            </Button>
                            <Button onClick={() => handleSubmit(1)}>
                                Publish Survey
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="manual">Manual Builder</TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2"><BiSend /> AI Generator</TabsTrigger>
                </TabsList>

                {/* MANUAL BUILDER TAB */}
                <TabsContent value="manual" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Basic Info & Location */}
                        <div className="space-y-6 md:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Survey Title <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Community Needs Assessment"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Brief description of the survey..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Target Location (Optional)</CardTitle>
                                    <CardDescription>Limit this survey to a specific region</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Division</Label>
                                        <Select value={division} onValueChange={setDivision}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Division" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem>
                                                    Select Division
                                                </SelectItem>
                                                {divisions.map(div => (
                                                    <SelectItem key={div.id} value={div.id.toString()}>
                                                        {div.name} ({div.bn_name})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>District</Label>
                                        <Select value={district} onValueChange={setDistrict} disabled={!division}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem>
                                                    Select District
                                                </SelectItem>
                                                {districts.map(dist => (
                                                    <SelectItem key={dist.id} value={dist.id.toString()}>
                                                        {dist.name} ({dist.bn_name})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Upazila</Label>
                                        <Select value={upazila} onValueChange={setUpazila} disabled={!district}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Upazila" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem>
                                                    Select Upazila
                                                </SelectItem>
                                                {upazilas.map(upa => (
                                                    <SelectItem key={upa.id} value={upa.id.toString()}>
                                                        {upa.name} ({upa.bn_name})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Union</Label>
                                        <Select value={union} onValueChange={setUnion} disabled={!upazila}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Union" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem>
                                                    Select Union
                                                </SelectItem>
                                                {unions.map(uni => (
                                                    <SelectItem key={uni.id} value={uni.id.toString()}>
                                                        {uni.name} ({uni.bn_name})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Questions Builder */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="min-h-[500px] flex flex-col">
                                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Questions</CardTitle>
                                        <CardDescription>Build your survey questions here</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleAddQuestion} className="w-full sm:w-auto gap-2">
                                        <BiPlus size={16} /> Add Question
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6 flex-1">
                                    {questions.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <p>No questions added yet.</p>
                                            <Button variant="link" onClick={handleAddQuestion}>Add your first question</Button>
                                        </div>
                                    ) : (
                                        questions.map((q, qIndex) => (
                                            <Card key={qIndex} className="relative group border-muted">
                                                <div className="absolute right-2 top-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center bg-white/80 rounded-md shadow-sm">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        disabled={qIndex === 0}
                                                        onClick={() => moveQuestionUp(qIndex)}
                                                        title="Move Up"
                                                    >
                                                        <BiUpArrowAlt size={20} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        disabled={qIndex === questions.length - 1}
                                                        onClick={() => moveQuestionDown(qIndex)}
                                                        title="Move Down"
                                                    >
                                                        <BiDownArrowAlt size={20} />
                                                    </Button>
                                                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveQuestion(qIndex)}
                                                        title="Remove Question"
                                                    >
                                                        <BiTrash size={18} />
                                                    </Button>
                                                </div>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <Label>Question Text</Label>
                                                            <Input
                                                                value={q.text}
                                                                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                                                placeholder="Enter question text"
                                                            />
                                                        </div>
                                                        <div className="w-full sm:w-[200px] space-y-2">
                                                            <Label>Type</Label>
                                                            <Select
                                                                value={q.type}
                                                                onValueChange={(val) => updateQuestion(qIndex, 'type', val)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="text">Short Text</SelectItem>
                                                                    <SelectItem value="long_text">Long Text</SelectItem>
                                                                    <SelectItem value="number">Number</SelectItem>
                                                                    <SelectItem value="multiple_choice">Single Choice</SelectItem>
                                                                    <SelectItem value="checkbox">Multiple Choice</SelectItem>
                                                                    <SelectItem value="date">Date</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Options for Multiple Choice / Checkbox */}
                                                    {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                                                        <div className="pl-4 border-l-2 border-muted space-y-2">
                                                            <Label className="text-xs text-muted-foreground uppercase">Options</Label>
                                                            {q.options.map((opt, oIndex) => (
                                                                <div key={oIndex} className="flex gap-2 items-center">
                                                                    <Input
                                                                        value={opt}
                                                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                        placeholder={`Option ${oIndex + 1}`}
                                                                        className="flex-1 h-9"
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                                    >
                                                                        <BiTrash size={16} />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-xs gap-1"
                                                                onClick={() => addOption(qIndex)}
                                                            >
                                                                <BiPlus size={12} /> Add Option
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Advanced Validation Rules */}
                                                    {q.hasValidation && (
                                                        <div className="p-4 bg-muted/30 rounded-md space-y-3 border border-dashed border-muted-foreground/30">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-xs font-semibold uppercase text-primary">Response Validation</Label>
                                                                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => toggleValidation(qIndex)}>Remove</Button>
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row gap-3">
                                                                {/* Validation Type Selector */}
                                                                <div className="w-full sm:w-[140px]">
                                                                    <Select
                                                                        value={q.validation.type}
                                                                        onValueChange={(val) => {
                                                                            updateValidation(qIndex, 'type', val);
                                                                            updateValidation(qIndex, 'operator', '');
                                                                        }}
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
                                                                        value={q.validation.operator}
                                                                        onValueChange={(val) => updateValidation(qIndex, 'operator', val)}
                                                                    >
                                                                        <SelectTrigger className="h-8 text-xs">
                                                                            <SelectValue placeholder="Operator" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {q.validation.type === 'number' && (
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
                                                                            {q.validation.type === 'text' && (
                                                                                <>
                                                                                    <SelectItem value="CONTAINS">Contains</SelectItem>
                                                                                    <SelectItem value="NOT_CONTAINS">Does not contain</SelectItem>
                                                                                    <SelectItem value="EMAIL">Email address</SelectItem>
                                                                                    <SelectItem value="URL">URL</SelectItem>
                                                                                </>
                                                                            )}
                                                                            {q.validation.type === 'length' && (
                                                                                <>
                                                                                    <SelectItem value="MAX_CHARS">Maximum character count</SelectItem>
                                                                                    <SelectItem value="MIN_CHARS">Minimum character count</SelectItem>
                                                                                </>
                                                                            )}
                                                                            {q.validation.type === 'regex' && (
                                                                                <>
                                                                                    <SelectItem value="MATCHES">Matches</SelectItem>
                                                                                    <SelectItem value="NOT_MATCHES">Doesn't match</SelectItem>
                                                                                </>
                                                                            )}
                                                                            {q.validation.type === 'select' && (
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
                                                                {!['IS_NUMBER', 'WHOLE_NUMBER', 'EMAIL', 'URL'].includes(q.validation.operator) && (
                                                                    <div className="flex-1 flex gap-2">
                                                                        <Input
                                                                            className="h-8 text-xs"
                                                                            placeholder={
                                                                                q.validation.type === 'regex' ? 'Pattern' : 'Number/Text'
                                                                            }
                                                                            value={q.validation.value}
                                                                            onChange={(e) => updateValidation(qIndex, 'value', e.target.value)}
                                                                        />
                                                                        {['BETWEEN', 'NOT_BETWEEN'].includes(q.validation.operator) && (
                                                                            <Input
                                                                                className="h-8 text-xs"
                                                                                placeholder="Max"
                                                                                value={q.validation.value2}
                                                                                onChange={(e) => updateValidation(qIndex, 'value2', e.target.value)}
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
                                                                    value={q.validation.errorMessage}
                                                                    onChange={(e) => updateValidation(qIndex, 'errorMessage', e.target.value)}
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
                                                                    onChange={(e) => updateQuestion(qIndex, 'required', e.target.checked)}
                                                                    className="h-4 w-4 bg-background border-input rounded ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                />
                                                                Required
                                                            </label>
                                                        </div>

                                                        {/* Simple Validation Toggle Button */}
                                                        {['text', 'number', 'checkbox', 'long_text'].includes(q.type) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-xs gap-1"
                                                                onClick={() => toggleValidation(qIndex)}
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
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* AI GENERATOR TAB */}
                <TabsContent value="ai" className="space-y-6">
                    <Card className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-slate-50">
                        <CardHeader className="text-center space-y-4 max-w-2xl mx-auto">
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                                <BiSend className="text-3xl" />
                            </div>
                            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                                AI Survey Generator
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Describe what you want to learn from your audience, and our AI will generate a complete survey with relevant questions, options, and settings for you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="w-full max-w-2xl space-y-6">
                            <div className="space-y-2">
                                <Label className="text-base">What is this survey about?</Label>
                                <Textarea
                                    placeholder="e.g., A comprehensive employee satisfaction survey focusing on work-life balance, management support, and career growth opportunities."
                                    className="min-h-[150px] text-lg resize-none shadow-sm p-4"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground text-right">{aiPrompt.length}/500 chars</p>
                            </div>

                            <Button
                                size="lg"
                                className="w-full text-lg h-14 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
                                onClick={handleAiGenerate}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2"><Spinner className="w-5 h-5 text-white" size={20} /> Generating Survey...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><BiSend /> Generate Survey</span>
                                )}
                            </Button>

                            <div className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground pt-8 border-t">
                                <div>
                                    <span className="font-semibold block text-foreground">Intelligent</span>
                                    Context-aware questions
                                </div>
                                <div>
                                    <span className="font-semibold block text-foreground">Complete</span>
                                    Auto-generated options
                                </div>
                                <div>
                                    <span className="font-semibold block text-foreground">Fast</span>
                                    Ready in seconds
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    )
}

export default function Questionaire() {
    return (
        <Suspense fallback={<LoadingState message="Loading Questionnaire..." />}>
            <QuestionaireContent />
        </Suspense>
    )
}