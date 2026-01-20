import { NextResponse } from 'next/server';
import { Upazilla } from '@/models';

export async function GET(request, { params }) {
    try {
        const { districtId } = await params;

        // Note: Model is named `Upazilla` (double l) based on file name, verify import
        const upazillas = await Upazilla.findAll({
            where: { district_id: districtId },
            order: [['name', 'ASC']]
        });
        return NextResponse.json(upazillas);
    } catch (error) {
        console.error("Get Upazillas Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
