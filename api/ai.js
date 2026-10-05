export default async function handler(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
	const { image, prompt, size } = req.body || {};
	if (!image || !prompt) return res.status(400).json({ error: 'Faltan datos' });

	try {
		const buf = Buffer.from(String(image).split(',')[1], 'base64');
		const fd = new FormData();
		fd.append('model', process.env.IMAGE_MODEL || 'gpt-image-1');
		fd.append('prompt', String(prompt).slice(0, 3000));
		fd.append('size', ['1024x1024', '1536x1024', '1024x1536'].includes(size) ? size : '1024x1536');
		fd.append('quality', 'medium');
		fd.append('output_format', 'jpeg');
		fd.append('image', new Blob([buf], { type: 'image/jpeg' }), 'foto.jpg');

		const r = await fetch('https://api.openai.com/v1/images/edits', {
			method: 'POST',
			headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
			body: fd,
		});
		const j = await r.json();
		if (!r.ok) return res.status(r.status).json({ error: j.error?.message || 'Error del proveedor' });
		res.status(200).json({ image: 'data:image/jpeg;base64,' + j.data[0].b64_json });
	} catch (e) {
		res.status(500).json({ error: 'Error interno' });
	}
}
