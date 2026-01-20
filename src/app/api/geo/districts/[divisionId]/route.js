import { NextResponse } from 'next/server';
import { District } from '@/models';

export async function GET(request, { params }) {
    try {
        const { divisionId } = await params;
        const districts = await District.findAll({
            where: { division_id: divisionId },
            order: [['name', 'ASC']]
        });
        return NextResponse.json(districts);
    } catch (error) {
        console.error("Get Districts Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
