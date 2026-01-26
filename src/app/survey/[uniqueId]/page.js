'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { BiError, BiMap, BiCheckCircle } from "react-icons/bi"
import toast from 'react-hot-toast'
import { useParams } from 'next/navigation'

export default function PublicSurveyPage() {
    const { uniqueId: paramsId } = useParams()

    // States
    const [survey, setSurvey] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)
    const [loading, setLoading] = useState(true)
    const [answers, setAnswers] = useState({}) // { [questionId]: value }
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    // Geolocation State
    const [location, setLocation] = useState({ lat: null, long: null })
    const [geoPermission, setGeoPermission] = useState('prompt') // prompt, granted, denied
    const [geoError, setGeoError] = useState(null)

    useEffect(() => {
        fetchSurvey()
    }, [])

    useEffect(() => {
        if (survey && survey.is_geo_location_required) {
            checkPermissionAndRequest()
        }
    }, [survey])

    const checkPermissionAndRequest = async () => {
        if (!navigator.geolocation) {
            setGeoPermission('denied')
            setGeoError("Geolocation is not supported")
            return
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' })
            if (result.state === 'granted') {
                requestLocation()
            } else if (result.state === 'prompt') {
                requestLocation() // Will show browser prompt
            } else {
                setGeoPermission('denied')
            }

            result.onchange = () => {
                if (result.state === 'granted') requestLocation()
                else setGeoPermission(result.state)
            }
        } catch (e) {
            requestLocation() // Fallback
        }
    }

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setGeoError("Geolocation is not supported by your browser")
            setGeoPermission('denied')
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    long: position.coords.longitude
                })
                setGeoPermission('granted')
                setGeoError(null)
            },
            (error) => {
                console.log("Geo Error Details:", { code: error.code, message: error.message });

                if (error.code === error.PERMISSION_DENIED) {
                    setGeoPermission('denied')
                    setGeoError("Location permission denied. Please enable it in your browser settings.")
                } else if (error.code === error.TIMEOUT) {
                    setGeoError("Location request timed out. Please try refreshing.")
                } else {
                    setGeoError("Unable to retrieve location. Error: " + error.message)
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }

    const fetchSurvey = async () => {
        try {
            const res = await fetch(`/api/surveys/${paramsId}`)
            const data = await res.json()

            if (!res.ok) {
                console.error("Fetch Survey Error Details:", data)
                throw new Error(data.message || 'Survey not found or unavailable')
            }

            setSurvey(data)
        } catch (error) {
            console.error("Fetch Survey Exception:", error)
            toast.error(error.message || "Failed to load survey")
            setErrorMsg(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }))
    }

    const handleCheckboxChange = (questionId, option, checked) => {
        setAnswers(prev => {
            const current = prev[questionId] || []
            if (checked) {
                return { ...prev, [questionId]: [...current, option] }
            } else {
                return { ...prev, [questionId]: current.filter(item => item !== option) }
            }
        })
    }

    // Validation Helper
    const checkValidation = (question, answer) => {
        let rules = question.validation
        // Try parsing if string
        if (typeof rules === 'string') {
            try { rules = JSON.parse(rules) } catch (e) { rules = null }
        }

        if (!rules || !rules.type) return null // No extra rules

        // 1. Number Validation
        if (rules.type === 'number' && question.type === 'number') {
            const val = parseFloat(answer)
            if (isNaN(val)) return rules.errorMessage || "Must be a valid number"
            const limit = parseFloat(rules.value)
            const limit2 = parseFloat(rules.value2)

            switch (rules.operator) {
                case 'GT': if (val <= limit) return rules.errorMessage || `Must be greater than ${limit}`; break;
                case 'GTE': if (val < limit) return rules.errorMessage || `Must be greater than or equal to ${limit}`; break;
                case 'LT': if (val >= limit) return rules.errorMessage || `Must be less than ${limit}`; break;
                case 'LTE': if (val > limit) return rules.errorMessage || `Must be less than or equal to ${limit}`; break;
                case 'EQ': if (val !== limit) return rules.errorMessage || `Must be equal to ${limit}`; break;
                case 'NEQ': if (val === limit) return rules.errorMessage || `Must not be equal to ${limit}`; break;
                case 'BETWEEN': if (val < limit || val > limit2) return rules.errorMessage || `Must be between ${limit} and ${limit2}`; break;
                case 'NOT_BETWEEN': if (val >= limit && val <= limit2) return rules.errorMessage || `Must not be between ${limit} and ${limit2}`; break;
            }
        }

        // 2. Text/Regex Validation
        if (rules.type === 'text' || rules.type === 'regex' || rules.type === 'length') {
            const val = String(answer || '')

            if (rules.type === 'length') {
                const limit = parseInt(rules.value)
                if (rules.operator === 'MAX_CHARS' && val.length > limit) return rules.errorMessage || `Max ${limit} characters`;
                if (rules.operator === 'MIN_CHARS' && val.length < limit) return rules.errorMessage || `Min ${limit} characters`;
            }

            if (rules.type === 'text') {
                if (rules.operator === 'CONTAINS' && !val.includes(rules.value)) return rules.errorMessage || `Must contain "${rules.value}"`;
                if (rules.operator === 'NOT_CONTAINS' && val.includes(rules.value)) return rules.errorMessage || `Must not contain "${rules.value}"`;
                if (rules.operator === 'EMAIL') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!emailRegex.test(val)) return rules.errorMessage || "Invalid email address";
                }
                if (rules.operator === 'URL') {
                    try { new URL(val) } catch (_) { return rules.errorMessage || "Invalid URL"; }
                }
            }

            if (rules.type === 'regex' && rules.value) {
                try {
                    const regex = new RegExp(rules.value)
                    if (rules.operator === 'MATCHES' && !regex.test(val)) return rules.errorMessage || "Invalid format";
                    if (rules.operator === 'NOT_MATCHES' && regex.test(val)) return rules.errorMessage || "Invalid format";
                } catch (e) {
                    console.error("Invalid Regex", e)
                }
            }
        }

        // 3. Select/Checkbox Limit Validation
        if (rules.type === 'select' && Array.isArray(answer)) {
            const limit = parseInt(rules.value)
            switch (rules.operator) {
                case 'MIN': if (answer.length < limit) return rules.errorMessage || `Select at least ${limit} options`; break;
                case 'MAX': if (answer.length > limit) return rules.errorMessage || `Select at most ${limit} options`; break;
                case 'EXACT': if (answer.length !== limit) return rules.errorMessage || `Select exactly ${limit} options`; break;
            }
        }

        return null // No error
    }

    const [errors, setErrors] = useState({})

    const validateForm = () => {
        if (!survey) return false

        const newErrors = {}
        let isValid = true

        for (const q of survey.questions) {
            const ans = answers[q.id]

            // Required Check
            if (q.required) {
                if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && !ans.trim())) {
                    newErrors[q.id] = "This question is required"
                    isValid = false
                    continue
                }
            }

            // Advanced Validation (only if answer exists)
            if (ans && (ans.length > 0 || typeof ans === 'number')) {
                const error = checkValidation(q, ans)
                if (error) {
                    newErrors[q.id] = error
                    isValid = false
                }
            }
        }

        setErrors(newErrors)

        if (!isValid) {
            toast.error("Please fix the errors in the form")
            // Scroll to first error
            const firstErrorId = Object.keys(newErrors)[0]
            if (firstErrorId) {
                const el = document.getElementById(`question-card-${firstErrorId}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }

        return isValid
    }

    const handleSubmit = async () => {
        if (!validateForm()) return
        if (survey.is_geo_location_required && geoPermission !== 'granted') {
            toast.error("Location access is required")
            requestLocation()
            return
        }

        setSubmitting(true)

        // Transform answers to match backend requirement
        const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
            question_id: parseInt(qId),
            answer: val
        }))

        try {
            const payload = {
                answers: formattedAnswers,
                latitude: location.lat,
                longitude: location.long
            }

            const res = await fetch(`/api/surveys/${survey.unique_id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok) {
                console.error("Submission Error Details:", data)
                throw new Error(data.message || 'Submission failed')
            }

            setSubmitted(true)
            toast.success("Response submitted successfully!")
        } catch (error) {
            console.error("Submit Exception:", error)
            toast.error(error.message || "Failed to submit response")
        } finally {
            setSubmitting(false)
        }
    }

    // --- RENDER ---

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
    }

    if (!survey) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">{errorMsg || "Survey not found"}</div>
    }

    // Strict Geo Blocking Screen (Required AND Not Granted)
    if (survey.is_geo_location_required && geoPermission !== 'granted') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                            <BiMap className="text-red-500 text-3xl" />
                        </div>
                        <CardTitle>Location Required</CardTitle>
                        <CardDescription>
                            To participate in <strong>"{survey.title}"</strong>, you must enable location access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            We verify that responses are submitted from valid locations to ensure data integrity.
                            Please enable location permissions in your browser settings and try again.
                        </p>
                        {geoError && <p className="text-red-500 text-sm mt-2">{geoError}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={requestLocation}>Retry Location Access</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Existing Denied Logic for consistent UX if it was optional but user manually denied? 
    // Actually if optional, we probably don't block. But original code blocked whenever denied.
    // Let's stick to the new requirement: Only block if required. 
    // If NOT required, we proceed even if denied (unless original logic intended to ALWAYS block if denied? Original logic blocked if geoPermission == 'denied').
    // User said "if location /gps permission has given... it should ask only when its not given".
    // User also said "if location not granted then form must not be displayed! (if location required)".

    // I will keep the strict block above for is_geo_location_required.
    // For optional, I will allow render.


    // Success Screen
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <BiCheckCircle className="text-green-600 text-3xl" />
                        </div>
                        <CardTitle>Thank You!</CardTitle>
                        <CardDescription>
                            Your response to <strong>"{survey.title}"</strong> has been recorded.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header Card */}
                <Card className="border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="text-2xl md:text-3xl">{survey.title}</CardTitle>
                        <CardDescription className="text-base mt-2 whitespace-pre-wrap">
                            {survey.description}
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Questions */}
                {survey.questions && survey.questions.map((q, index) => (
                    <Card key={q.id} id={`question-card-${q.id}`} className={errors[q.id] ? "border-red-500 ring-1 ring-red-500" : ""}>
                        <CardHeader className="pb-2">
                            <div className="flex gap-1">
                                <span className="font-medium text-muted-foreground">{index + 1}.</span>
                                <div className="space-y-1">
                                    <Label className="text-base font-medium block">
                                        {q.question} {q.required && <span className="text-red-500">*</span>}
                                    </Label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Render Logic based on type matching seeding/backend */}
                            {q.type === 'text' && (
                                <Input
                                    placeholder="Your answer"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                                    className={errors[q.id] ? "border-red-500" : ""}
                                />
                            )}
                            {q.type === 'number' && (
                                <Input
                                    type="number"
                                    placeholder="Number"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                                    className={errors[q.id] ? "border-red-500" : ""}
                                />
                            )}
                            {q.type === 'long_text' && (
                                <Textarea
                                    placeholder="Your answer"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                                    className={errors[q.id] ? "border-red-500" : ""}
                                />
                            )}
                            {q.type === 'date' && (
                                <Input
                                    type="date"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                                    className={errors[q.id] ? "border-red-500" : ""}
                                />
                            )}
                            {q.type === 'multiple_choice' && (
                                <div className="space-y-2">
                                    {(() => {
                                        let opts = q.options || [];
                                        if (typeof opts === 'string') {
                                            try {
                                                opts = JSON.parse(opts);
                                                // Handle double stringification
                                                if (typeof opts === 'string') {
                                                    opts = JSON.parse(opts);
                                                }
                                            } catch (e) {
                                                opts = [];
                                            }
                                        }
                                        if (!Array.isArray(opts)) opts = [];

                                        return opts.map((opt, i) => (
                                            <div key={i} className="flex items-center space-x-2">
                                                <input
                                                    type='radio'
                                                    value={opt}
                                                    id={`q${q.id}-opt${i}`}
                                                    name={`q${q.id}`}
                                                    checked={answers[q.id] === opt}
                                                    onChange={() => handleInputChange(q.id, opt)}
                                                />
                                                <Label htmlFor={`q${q.id}-opt${i}`}>{opt}</Label>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            )}
                            {q.type === 'checkbox' && (
                                <div className="space-y-2">
                                    {(() => {
                                        let opts = q.options || [];
                                        if (typeof opts === 'string') {
                                            try {
                                                opts = JSON.parse(opts);
                                                // Handle double stringification
                                                if (typeof opts === 'string') {
                                                    opts = JSON.parse(opts);
                                                }
                                            } catch (e) {
                                                opts = [];
                                            }
                                        }
                                        if (!Array.isArray(opts)) opts = [];

                                        return opts.map((opt, i) => (
                                            <div key={i} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`q${q.id}-check${i}`}
                                                    checked={(answers[q.id] || []).includes(opt)}
                                                    onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
                                                />
                                                <Label htmlFor={`q${q.id}-check${i}`}>{opt}</Label>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            )}



                            {/* Error Message Display */}
                            {errors[q.id] && (
                                <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    <BiError /> {errors[q.id]}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                <div className="flex justify-end pt-4">
                    <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Survey"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
