
import { NextResponse } from 'next/server';
import { User } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
        const { newPassword } = await request.json();

        if (!newPassword) {
            return NextResponse.json({ message: "New password is required" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ message: "New password must be at least 6 characters" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ message: "Invalid token" }, { status: 401 });
        }

        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'email', 'password']
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }



        user.password = newPassword;
        await user.save(); // User model hooks should handle hashing

        return NextResponse.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
