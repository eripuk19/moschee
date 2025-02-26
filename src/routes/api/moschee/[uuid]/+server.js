import { createConnection } from '$lib/db/mysql';
import {BASIC_AUTH_USER, BASIC_AUTH_PASSWORD} from '$env/static/private';
 
 
export async function GET({ params }) {
    const connection = await createConnection();
    const { uuid } = params;
 
    const [rows] = await connection.execute('SELECT * FROM moschee WHERE id = ?', [uuid]);
    await connection.end();
 
    if (rows.length === 0) {
        return new Response(JSON.stringify({ error: "Moschee not found" }), { status: 404 });
    }
 
    return new Response(JSON.stringify(rows[0]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}
 
async function auth(request) {
    const auth = request.headers.get('authorization');
    if (!auth || auth !== `Basic ${btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)}`) {
        return new Response(null, {
                status: 401,
                headers: { 'www-authenticate': 'Basic realm="Secure Area"' }
            });
        }
    const base64Credentials = auth.split(' ')[1];
    const credentials = atob(base64Credentials);    
    const [username, password] = credentials.split(':');
        if (username !== BASIC_AUTH_USER || password !== BASIC_AUTH_PASSWORD) {
            return new Response(JSON.stringify({ message:'Access denied'}), {
                status: 401,
                headers: { 'www-authenticate': 'Basic realm="Secure Area"' }
            });
        }
        return null;
    }
 
 
export async function PUT({ params, request }) {
 
    const authResponse = await auth(request);
    if (authResponse) return authResponse;
 
 
    const connection = await createConnection();
    const { uuid } = params;
    const data = await request.json();
 
    // Ensure at least one field is provided
    const allowedFields = ['name', 'city', 'year'];
    const updates = [];
    const values = [];
 
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(data[field]);
        }
    }
 
    if (updates.length === 0) {
        return new Response(JSON.stringify({ error: "No data to update" }), { status: 400 });
    }
 
    values.push(uuid); // Add UUID to the values array for WHERE condition
 
    const query = `UPDATE moschee SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
 
    await connection.end();
 
    if (result.affectedRows === 0) {
        return new Response(JSON.stringify({ error: "Moschee not found" }), { status: 404 });
    }
 
    return new Response(JSON.stringify({ message: "Moschee updated successfully" }), { status: 200 });
}
 
export async function DELETE({ params, request }) {
 
    const authResponse = await auth(request);
    if (authResponse) return authResponse;
 
 
    const connection = await createConnection();
    const { uuid } = params;
 
    await connection.execute('DELETE FROM moschee WHERE id = ?', [uuid]);
    await connection.end();
 
    return new Response(null, { status: 204 });
}