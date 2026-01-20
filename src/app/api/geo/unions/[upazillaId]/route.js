import { NextResponse } from 'next/server';
import { Union } from '@/models';

export async function GET(request, { params }) {
    try {
        const { upazillaId } = await params;
        const unions = await Union.findAll({
            where: { upazilla_id: upazillaId },
            order: [['name', 'ASC']]
        });
        return NextResponse.json(unions);
    } catch (error) {
        console.error("Get Unions Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
