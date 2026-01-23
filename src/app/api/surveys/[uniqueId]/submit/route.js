import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Survey, District, Division, Upazilla, Union, SurveyResponse, SurveyAnswer, sequelize } from '@/models';
import { verifyGeoLocation } from '@/lib/geoUtils';

export async function POST(request, { params }) {
    const { uniqueId } = await params;
    // const token = cookies().get('auth_token')?.value;
    // if (!token) {
    //     return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    // }
    const transaction = await sequelize.transaction();
    try {

        const { answers, latitude, longitude } = await request.json();
        const user_agent = request.headers.get('user-agent');
        const respondent_ip = request.headers.get('x-forwarded-for') || request.socket.remoteAddress;

        const survey = await Survey.findOne({
            where: { unique_id: uniqueId },
            include: [
                // { model: District, as: 'district' }, // Ensure association exists or fetch separately if needed
                // Note: Standard Survey model might not include District directly if alias is not default.
                // Checking Model: Survey.belongsTo(District) isn't explicit in snippet, but field district_id exists.
                // Let's fetch District separately to be safe and avoid include errors if association alias mismatch.
            ]
        });

        if (!survey) {
            await transaction.rollback();
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        if (survey.status === 0) {
            await transaction.rollback();
            return NextResponse.json({ message: "This survey is currently not available." }, { status: 403 });
        }

        // --- GEO VALIDATION ---
        if (survey.is_geo_location_required && (!latitude || !longitude)) {
            await transaction.rollback();
            return NextResponse.json({ message: "Location access is required to submit this survey." }, { status: 400 });
        }

        if (latitude && longitude) {
            const { isValid, message } = await verifyGeoLocation(survey, parseFloat(latitude), parseFloat(longitude), { Division, District, Upazilla, Union });

            if (!isValid) {
                await transaction.rollback();
                console.log(`Geo Verification Failed: ${message}`);
                return NextResponse.json({ message: message || "Location verification failed." }, { status: 400 });
            }
        }
        // ----------------------

        // Create Response Entry
        const response = await SurveyResponse.create({
            survey_id: survey.id,
            respondent_ip,
            user_agent,
            latitude,
            longitude
        }, { transaction });

        if (answers && answers.length > 0) {
            const answerData = answers.map(ans => ({
                response_id: response.id,
                question_id: ans.question_id,
                answer_text: typeof ans.answer === 'object' ? null : String(ans.answer),
                answer_json: typeof ans.answer === 'object' ? ans.answer : null
            }));

            await SurveyAnswer.bulkCreate(answerData, { transaction });
        }

        await transaction.commit();
        return NextResponse.json({ message: "Response submitted successfully", id: response.id }, { status: 201 });

    } catch (error) {
        await transaction.rollback();
        console.error("Submit Response Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
