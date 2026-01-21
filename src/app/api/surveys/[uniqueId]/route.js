import { NextResponse } from 'next/server';
import { Survey, SurveyQuestion } from '@/models';

export async function GET(request, { params }) {
    try {
        const { uniqueId } = await params;

        const survey = await Survey.findOne({
            where: (typeof uniqueId === 'string' && uniqueId.length > 5) ? { unique_id: uniqueId } : { id: uniqueId },
            include: [{ model: SurveyQuestion, as: 'questions' }]
        });

        if (!survey) {
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        if (survey.status === 0) {
            return NextResponse.json({ message: "This survey is currently not available." }, { status: 403 });
        }

        return NextResponse.json(survey);
    } catch (error) {
        console.error("Get Public Survey Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
