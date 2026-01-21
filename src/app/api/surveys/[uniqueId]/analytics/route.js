import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Survey, SurveyQuestion, SurveyResponse, SurveyAnswer } from '@/models';

export const dynamic = 'force-dynamic';

// export async function GET(request, { params }) {
//     const { uniqueId } = params;
//     const token = cookies().get('auth_token')?.value;
//     if (!token) {
//         return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
//     }
//     try {
//         const res = await fetch(`${BACKEND_URL}/api/surveys/${uniqueId}/analytics`, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${token}`
//             },
//             cache: 'no-store'
//         });

//         const data = await res.json();
//         return NextResponse.json(data, { status: res.status });
//     } catch (error) {
//         return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//     }
// }

export async function GET(request, { params }) {
    try {
        const { uniqueId: paramId } = await params;

        const survey = await Survey.findOne({
            where: typeof paramId === 'string' && paramId.length > 5 ? { unique_id: paramId } : { id: paramId },
            include: [{ model: SurveyQuestion, as: 'questions' }]
        });

        if (!survey) {
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        // 1. Total Responses
        const totalResponses = await SurveyResponse.count({ where: { survey_id: survey.id } });

        // 2. Geolocation Data (Heatmap)
        const locations = await SurveyResponse.findAll({
            where: { survey_id: survey.id },
            attributes: ['latitude', 'longitude'],
            raw: true
        });
        // Filter out nulls
        const validLocations = locations.filter(l => l.latitude && l.longitude);

        // 3. Question Analytics
        const analytics = await Promise.all(survey.questions.map(async (q) => {
            const stats = {
                id: q.id,
                question: q.question,
                type: q.type,
                total: 0,
                data: null
            };

            // Fetch ALL answers for this question
            const answers = await SurveyAnswer.findAll({
                where: { question_id: q.id },
                attributes: ['answer_text', 'answer_json', 'createdAt'],
                order: [['createdAt', 'DESC']],
                raw: true
            });
            stats.total = answers.length;

            if (q.type === 'multiple_choice' || q.type === 'checkbox' || q.type === 'date') {
                const counts = {};

                answers.forEach(a => {
                    // Normalize Answer
                    let val = a.answer_text;
                    const jsonVal = a.answer_json;

                    if (Array.isArray(jsonVal)) {
                        jsonVal.forEach(v => {
                            if (v) counts[v] = (counts[v] || 0) + 1;
                        });
                    } else if (val) {
                        counts[val] = (counts[val] || 0) + 1;
                    } else if (jsonVal) {
                        counts[jsonVal] = (counts[jsonVal] || 0) + 1;
                    }
                });

                // Sort dates if type is date
                let chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
                if (q.type === 'date') {
                    chartData.sort((a, b) => new Date(a.name) - new Date(b.name));
                }

                stats.data = chartData;

            } else if (q.type === 'number') {
                const values = answers
                    .map(a => parseFloat(a.answer_text))
                    .filter(v => !isNaN(v));

                if (values.length > 0) {
                    const sum = values.reduce((a, b) => a + b, 0);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const avg = (sum / values.length).toFixed(2);

                    // Frequency for Chart
                    const counts = {};
                    values.forEach(v => {
                        counts[v] = (counts[v] || 0) + 1;
                    });
                    const chartData = Object.entries(counts)
                        .map(([name, value]) => ({ name: Number(name), value }))
                        .sort((a, b) => a.name - b.name); // Sort numerically

                    stats.data = { average: avg, min, max, chart: chartData };
                } else {
                    stats.data = { average: 0, min: 0, max: 0, chart: [] };
                }

            } else {
                // Text / Long Text
                stats.data = answers.slice(0, 10).map(a => a.answer_text || JSON.stringify(a.answer_json));
            }

            return stats;
        }));

        // 4. Raw Responses (For Cross-Tabulation Heatmap)
        const rawResponsesData = await SurveyResponse.findAll({
            where: { survey_id: survey.id },
            attributes: ['id', 'latitude', 'longitude'],
            include: [{
                model: SurveyAnswer,
                as: 'answers',
                attributes: ['question_id', 'answer_text', 'answer_json']
            }]
        });

        return NextResponse.json({
            survey: {
                title: survey.title,
                unique_id: survey.unique_id
            },
            totalResponses,
            locations: validLocations,
            questions: analytics,
            rawResponses: rawResponsesData
        }, { status: 200 });

    } catch (error) {
        console.error("Get Analytics Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
