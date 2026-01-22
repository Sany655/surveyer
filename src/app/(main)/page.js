'use client'

import React, { useEffect, useState } from 'react'
import { LoadingState } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BiCopy, BiEdit, BiTrash, BiBarChart } from "react-icons/bi"
import Link from 'next/link'
import toast from 'react-hot-toast'
// import DefaultLayout from '@/app/components/layout/DefaultLayout'
// import ProtectedRoute from '@/app/components/ProtectedRoute'

function Surveys() {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/surveys')
      if (!res.ok) throw new Error('Failed to fetch surveys')
      const data = await res.json()
      setSurveys(data)
    } catch (error) {
      console.error(error)
      toast.error("Could not load surveys")
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (uniqueId) => {
    const link = `${window.location.origin}/survey/${uniqueId}`
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard!")
  }

  const deleteSurvey = async (uniqueId) => {
    // Initial confirmation
    if (!confirm("Are you sure you want to delete this survey?")) return

    try {
      const res = await fetch(`/api/surveys/${uniqueId}/manage`, { method: 'DELETE' })

      if (res.status === 409) {
        const data = await res.json()
        // Second confirmation with specific message from backend
        if (confirm(`${data.message}\n\nDo you want to proceed with deletion?`)) {
          // Force delete
          const resForce = await fetch(`/api/surveys/${uniqueId}/manage?force=true`, { method: 'DELETE' })
          if (!resForce.ok) throw new Error('Failed to delete')

          toast.success("Survey and all data deleted")
          setSurveys(surveys.filter(s => s.unique_id !== uniqueId))
          return
        } else {
          return // User cancelled
        }
      }

      if (!res.ok) throw new Error('Failed to delete')

      toast.success("Survey deleted")
      setSurveys(surveys.filter(s => s.unique_id !== uniqueId))
    } catch (error) {
      console.error(error)
      toast.error("Delete failed")
    }
  }

  return (
    // <DefaultLayout title="Surveys">
    //   <ProtectedRoute permissions={['view-surveys']}>
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Surveys</h1>
        <Link href="/create-survey">
          <Button>Create New Survey</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingState message="Loading your surveys..." />
      ) : surveys.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">You haven't created any surveys yet.</p>
          <Link href="/create-survey">
            <Button variant="outline">Create your first survey</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <Card key={survey.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="line-clamp-2" title={survey.title}>{survey.title}</CardTitle>
                  <Badge className={survey.status === 1 ? "bg-green-800" : "bg-gray-800"}>
                    {survey.status === 1 ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]" title={survey.description}>
                  {survey.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground">
                  <p>Questions: {survey.questions ? survey.questions.length : 0}</p>
                  <p>Responses: {survey.responses ? survey.responses.length : 0}</p>
                  <p>Division: {survey.division ? survey.division.name : 'N/A'}</p>
                  <p>District: {survey.district ? survey.district.name : 'N/A'}</p>
                  <p>Upazila: {survey.upazila ? survey.upazila.name : 'N/A'}</p>
                  <p>Union: {survey.union ? survey.union.name : 'N/A'}</p>
                  <p>Created: {new Date(survey.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button variant="outline" size="sm" onClick={() => copyLink(survey.id)} className="w-full">
                    <BiCopy className="mr-2" /> Link
                  </Button>
                  <Link href={`/${survey.id}/report`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      <BiBarChart className="mr-2" /> Report
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Link href={`/${survey.id}/edit`} className="w-full">
                    <Button variant="secondary" size="sm" className="w-full">
                      <BiEdit className="mr-2" /> Edit
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => deleteSurvey(survey.unique_id)} className="w-full">
                    <BiTrash className="mr-2" /> Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
    //   </ProtectedRoute>
    // </DefaultLayout>
  )
}

export default Surveys