import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request) {
    const token = request.cookies.get('auth_token')?.value
    const { pathname } = request.nextUrl

    // 1. Define Public Routes
    const isPublicPath =
        pathname === '/login' ||
        pathname.startsWith('/survey/') || // Public Survey View
        pathname.startsWith('/api/surveys') || // Public Survey APIs
        pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico'

    // Allow Geo API
    if (pathname.startsWith('/api/geo')) return NextResponse.next();
    if (pathname.startsWith('/api/auth')) return NextResponse.next();

    // Verify Token function
    const verifyToken = async (token) => {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET)
            await jwtVerify(token, secret)
            return true
        } catch (error) {
            return false
        }
    }

    const verified = token && await verifyToken(token)

    // Redirect Logic

    // If user is validated and tries to access Login
    if (verified && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Protection Logic
    // If NOT verified
    if (!verified) {
        // If trying to access Protected Dashboard Pages (Root or any other non-public page)
        if (!isPublicPath) {
            // API Protection (Important!)
            if (pathname.startsWith('/api') || pathname.startsWith('/api')) {
                // Allow specific public API endpoints
                const isAllowedApi =
                    (pathname.match(/^\/api\/surveys\/[^\/]+$/) && request.method === 'GET') || // Get Single
                    (pathname.match(/^\/api\/surveys\/[^\/]+\/submit$/) && request.method === 'POST') || // Submit
                    pathname.startsWith('/api/geo') // Geo

                if (!isAllowedApi) {
                    return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
                }
            } else {
                return NextResponse.redirect(new URL('/login', request.url))
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
