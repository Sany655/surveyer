import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Survey, District, SurveyResponse, SurveyAnswer, sequelize } from '@/models';

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
                { model: District, as: 'district' } // Ensure association exists or fetch separately if needed
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

        // --- GEO VALIDATION (District Level) ---
        // Fetch District if survey has one
        if (survey.district_id) {
            const district = await District.findByPk(survey.district_id);
            if (district && district.lat && district.lon && latitude && longitude) {
                const distLat = parseFloat(district.lat);
                const distLon = parseFloat(district.lon);
                const userLat = parseFloat(latitude);
                const userLon = parseFloat(longitude);

                // Haversine Formula
                const R = 6371; // Earth radius in km
                const dLat = (userLat - distLat) * Math.PI / 180;
                const dLon = (userLon - distLon) * Math.PI / 180;
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(distLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                console.log(`Geo Check: Dist ${district.name} to User: ${distance.toFixed(2)}km`);

                if (distance > 50) { // 50km radius threshold
                    await transaction.rollback();
                    return NextResponse.json({
                        message: `Location verification failed. You are ${distance.toFixed(1)}km away from the survey area (${district.name}).`
                    }, { status: 400 });
                }
            }
        }
        // ---------------------------------------

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
