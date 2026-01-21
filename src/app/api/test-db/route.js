import { NextResponse } from 'next/server';
import db from '@/models';

export async function GET() {
    try {
        await db.sequelize.authenticate();
        return NextResponse.json({
            status: 'success',
            message: 'Database connection has been established successfully.',
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Unable to connect to the database',
            error: error.message,
        }, { status: 500 });
    }
}
