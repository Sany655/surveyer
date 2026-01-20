import { NextResponse } from 'next/server';
import { Division } from '@/models';

export async function GET() {
    try {
        const divisions = await Division.findAll({
            order: [['name', 'ASC']]
        });
        return NextResponse.json(divisions);
    } catch (error) {
        console.error("Get Divisions Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
