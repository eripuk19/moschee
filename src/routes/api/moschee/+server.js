import { createConnection } from '$lib/db/mysql';
import {BASIC_AUTH_USER, BASIC_AUTH_PASSWORD} from '$env/static/private';
 

export async function GET() {
 
    let connection = await createConnection();
    let [rows] = await connection.execute('SELECT * FROM moschee');
    await connection.end();
 

    return new Response(JSON.stringify(rows), {
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

export async function POST({ request }) {
   
    const authResponse = await auth(request);
    if (authResponse) return authResponse;
 
    let connection = await createConnection();
    const data = await request.json();
   
    if(!data.name || !data.city || !data.year) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    await connection.execute('INSERT INTO moschee (name, city, year) VALUES (?,?,?)', [data.name, data.city, data.year]);
 
    await connection.end();
 
    return new Response(JSON.stringify(data), {
        status: 201,
        headers: { 'content-type': 'application/json' }
    });
}
 