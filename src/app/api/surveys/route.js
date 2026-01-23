import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Survey, SurveyQuestion, SurveyResponse, Division, District, Upazilla, Union } from '@/models';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify } from 'jose';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    try {
        const surveys = await Survey.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: SurveyQuestion, as: 'questions' }, { model: SurveyResponse, as: 'responses' }, { model: Division, as: 'division' }, { model: District, as: 'district' }, { model: Upazilla, as: 'upazila' }, { model: Union, as: 'union' }]
        });

        return NextResponse.json(surveys);
    } catch (error) {
        console.error("Get Surveys Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    let user_id = null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        user_id = payload.user ? payload.user.id : payload.id; // Support both structures
    } catch (err) {
        console.error("Token verification failed:", err);
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    try {
        const { title, description, location, questions, status } = await request.json();

        if (!title) {
            return NextResponse.json({ message: "Survey title is required" }, { status: 400 });
        }

        const unique_id = uuidv4();

        const survey = await Survey.create({
            unique_id,
            title,
            description,
            user_id,
            division_id: location?.division,
            district_id: location?.district,
            upazila_id: location?.upazila,
            union_id: location?.union,
            status: status !== undefined ? status : 1, // Default to 1 (Published) if not specified, or allow 0
            is_geo_location_required: request.is_geo_location_required ? 1 : 0
        });

        if (questions && questions.length > 0) {
            const questionsData = questions.map(q => ({
                survey_id: survey.id,
                question: q.text || q.question, // Handle both 'text' (frontend) and 'question' (backend) naming
                type: q.type,
                required: q.required,
                options: q.options,
                validation: q.validation
            }));

            await SurveyQuestion.bulkCreate(questionsData);
        }

        // Fetch complete survey with questions
        const createdSurvey = await Survey.findOne({
            where: { id: survey.id },
            include: [{ model: SurveyQuestion, as: 'questions' }]
        });

        return NextResponse.json(createdSurvey);

    } catch (error) {
        console.error("Create Survey Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
