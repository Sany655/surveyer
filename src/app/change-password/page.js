'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in all fields")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.message || 'Failed to update password')
            } else {
                toast.success("Password updated successfully")
                router.push('/') // Redirect to dashboard or keep on page? Dashboard seems safe.
            }

        } catch (error) {
            console.error(error)
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
                    <CardDescription>
                        Update your account password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
