export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({
			error: 'Método no permitido',
		});
	}

	const { image, prompt, size } = req.body || {};

	if (!image || !prompt) {
		return res.status(400).json({
			error: 'Faltan datos',
		});
	}

	try {
		// ---------------------------------------------------------
		// Convertir la imagen Base64 recibida desde el navegador
		// ---------------------------------------------------------
		const parts = String(image).split(',');
		const base64 = parts.length > 1 ? parts[1] : parts[0];

		if (!base64) {
			return res.status(400).json({
				error: 'Imagen inválida',
			});
		}

		const buf = Buffer.from(base64, 'base64');

		// ---------------------------------------------------------
		// Preparar petición para OpenAI
		// ---------------------------------------------------------
		const fd = new FormData();

	fd.append(
    'model',
    process.env.IMAGE_MODEL || 'gpt-image-2.5-sunburst'
);

fd.append(
    'prompt',
    String(prompt).slice(0, 32000)
);

const allowedSizes = [
    '1024x1024',
    '1536x1024',
    '1024x1536'
];

fd.append(
    'size',
    allowedSizes.includes(size)
        ? size
        : '1024x1536'
);

		fd.append('quality', 'max');

fd.append('output_format', 'jpeg');

fd.append('output_compression', '100');

		// Imagen original
		fd.append(
			'image',
			new Blob([buf], {
				type: 'image/jpeg',
			}),
			'foto.jpg',
		);

		// ---------------------------------------------------------
		// Llamada a OpenAI
		// ---------------------------------------------------------
		const r = await fetch('https://api.openai.com/v1/images/edits', {
			method: 'POST',

			headers: {
				Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
			},

			body: fd,
		});

		const j = await r.json();

		// ---------------------------------------------------------
		// Manejar errores de OpenAI
		// ---------------------------------------------------------
		if (!r.ok) {
			console.error('OpenAI Images API:', j);

			return res.status(r.status).json({
				error: j.error?.message || 'Error del proveedor',
			});
		}

		// ---------------------------------------------------------
		// Obtener imagen generada
		// ---------------------------------------------------------
		const b64 = j.data?.[0]?.b64_json;

		if (!b64) {
			return res.status(502).json({
				error: 'OpenAI no devolvió una imagen',
			});
		}

		// ---------------------------------------------------------
		// Respuesta al navegador
		// ---------------------------------------------------------
		return res.status(200).json({
			image: 'data:image/jpeg;base64,' + b64,
		});
	} catch (e) {
		console.error('AI endpoint:', e);

		return res.status(500).json({
			error: 'Error interno',
		});
	}
}
