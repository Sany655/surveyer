import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Survey, SurveyQuestion, SurveyResponse } from '@/models';
import { sequelize } from '@/models';

export async function DELETE(request, { params }) {
    const { uniqueId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    try {
        const survey = await Survey.findOne({ where: { unique_id: uniqueId } });

        if (!survey) {
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        const responseCount = await SurveyResponse.count({ where: { survey_id: survey.id } });

        if (responseCount > 0 && !force) {
            return NextResponse.json({
                message: `This survey has ${responseCount} response(s). Deleting it will permanently remove all associated data.`,
                requiresConfirmation: true
            }, { status: 409 });
        }

        // If force is true or no responses, delete everything
        // Manually delete dependent data if cascade isn't reliable, but usually CASCADE is set in DB.
        // Doing manual delete here to be safe and explicit.
        if (responseCount > 0) {
            await SurveyResponse.destroy({ where: { survey_id: survey.id } });
        }
        await SurveyQuestion.destroy({ where: { survey_id: survey.id } });
        await survey.destroy();

        return NextResponse.json({ message: "Survey deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Delete Survey Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { uniqueId } = await params;
    const body = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const transaction = await sequelize.transaction();
    try {
        const { title, description, location, questions } = body;

        const survey = await Survey.findOne({ where: { unique_id: uniqueId } });
        if (!survey) {
            await transaction.rollback();
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        // Check for existing responses
        const responseCount = await SurveyResponse.count({ where: { survey_id: survey.id }, transaction });
        const hasResponses = responseCount > 0;

        // Update Basic Info
        await survey.update({
            title,
            description,
            division_id: location?.division,
            district_id: location?.district,
            upazila_id: location?.upazila,
            union_id: location?.union,
            status: body.status !== undefined ? body.status : survey.status,
            is_geo_location_required: body.is_geo_location_required !== undefined ? body.is_geo_location_required : survey.is_geo_location_required
        }, { transaction });

        if (questions && questions.length > 0) {
            // if (hasResponses) {
            //     // Cannot update existing questions if responses exist, but can add new ones
            //     const newQuestions = questions.filter(q => !q.id);

            //     if (newQuestions.length > 0) {
            //         const questionData = newQuestions.map(q => ({
            //             survey_id: survey.id,
            //             question: q.text || q.question,
            //             type: q.type || 'text',
            //             options: q.options,
            //             required: q.required || false,
            //             validation: q.validation ? (typeof q.validation === 'object' ? JSON.stringify(q.validation) : q.validation) : null
            //         }));
            //         await SurveyQuestion.bulkCreate(questionData, { transaction });
            //     }

            //     console.log(`Survey ${uniqueId} has responses. Added ${newQuestions.length} new questions.`);
            // } else {
            // DELETE old questions
            await SurveyQuestion.destroy({ where: { survey_id: survey.id }, transaction });

            // CREATE new questions
            const questionData = questions.map(q => ({
                survey_id: survey.id,
                question: q.text || q.question, // Support both keys
                type: q.type || 'text',
                options: q.options, // Pass options directly as received
                required: q.required || false,
                validation: q.validation ? (typeof q.validation === 'object' ? JSON.stringify(q.validation) : q.validation) : null
            }));

            await SurveyQuestion.bulkCreate(questionData, { transaction });
            // }
        }

        await transaction.commit();
        return NextResponse.json({
            message: "Survey updated successfully",
            // warning: hasResponses ? "Questions were not updated because survey has responses." : null
            warning: null
        }, { status: 200 });

    } catch (error) {
        await transaction.rollback();
        console.error("Update Survey Error:", error);
        return NextResponse.json({ message: "Internal server error " + error.message }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    const { uniqueId: paramId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    try {
        const survey = await Survey.findOne({
            where: typeof paramId === 'string' && paramId.length > 5 ? { unique_id: paramId } : { id: paramId },
            include: [{ model: SurveyQuestion, as: 'questions' }]
        });

        if (!survey) {
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        const responseCount = await SurveyResponse.count({ where: { survey_id: survey.id } });

        return NextResponse.json({ ...survey.toJSON(), responseCount }, { status: 200 });
    } catch (error) {
        console.error("Get Survey Details Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
