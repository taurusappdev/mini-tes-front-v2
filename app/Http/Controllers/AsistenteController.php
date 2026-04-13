<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AsistenteController extends Controller
{
    public function realtimeToken(Request $request)
    {
        // Nota: esta versión genera el token efímero desde mini-tes-web (Laravel)
        // Recomendado: proteger con auth middleware + rate limit

        $apiKey = env('OPENAI_API_KEY');

        if (!$apiKey) {
            return response()->json([
                'ok' => false,
                'error' => 'Falta OPENAI_API_KEY en .env (mini-tes-web)',
            ], 500);
        }

        // En GET te llega por query (?session_id=...), en POST por body.
        $sessionId = trim((string) $request->input('session_id', 'web'));

        $ttl = (int) env('OPENAI_REALTIME_TOKEN_TTL_SECONDS', 600);
        $ttl = max(10, min($ttl, 7200)); // rango recomendado por la API :contentReference[oaicite:2]{index=2}

        $model = env('OPENAI_REALTIME_MODEL', 'gpt-realtime');
        $voice = env('OPENAI_REALTIME_VOICE', 'marin');

        $payload = [
            'expires_after' => [
                'anchor' => 'created_at',
                'seconds' => $ttl,
            ],
            'session' => [
                'type' => 'realtime',
                'model' => $model,

                // ✅ B-light: instrucciones para “Atenea Taurus”
                // Si no envías esto, usará defaults del servidor :contentReference[oaicite:3]{index=3}
                'instructions' =>
                    "Eres Atenea, asistente de Taurus. Responde en español (es-MX). " .
                    "Para preguntas operativas (producción, moldes, códigos, scrap, OEE, etc.) " .
                    "DEBES usar la herramienta mini_tes_ask para consultar Mini-TES. " .
                    "Si la pregunta es general, responde normal. " .
                    "Si no hay datos en Mini-TES, dilo claro y pide el dato faltante. " .
                    "La herramienta mini_tes_ask devuelve un JSON con campo 'text'. " .
                    "session_id={$sessionId}",

                'audio' => [
                    // ✅ “Modo llamada” (VAD + respuesta automática + interrupción)
                    'input' => [
                        'turn_detection' => [
                            'type' => 'server_vad',
                            'create_response' => true,
                            'interrupt_response' => true,
                            'silence_duration_ms' => 450,
                        ],
                    ],
                    'output' => [
                        'voice' => $voice,
                    ],
                ],

                // ✅ Tool única puente (B-light)
                'tools' => [[
                    'type' => 'function',
                    'name' => 'mini_tes_ask',
                    'description' => 'Consulta Mini-TES (GraphQL/BD) y regresa texto para el usuario.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'pregunta' => ['type' => 'string'],
                            // opcional: el cliente puede forzar su session_id aunque el modelo no lo sepa
                            'session_id' => ['type' => 'string'],
                        ],
                        'required' => ['pregunta'],
                        'additionalProperties' => false,
                    ],
                ]],

                // recomendado: no fuerces tool para “hola”
                'tool_choice' => 'auto',
            ],
        ];

        try {
            $resp = Http::timeout(20)
                ->withToken($apiKey)
                ->acceptJson()
                ->post('https://api.openai.com/v1/realtime/client_secrets', $payload);
        } catch (\Throwable $e) {
            Log::error('OpenAI realtime-token exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'OpenAI realtime-token exception',
            ], 500);
        }

        if (!$resp->successful()) {
            Log::error('OpenAI realtime-token failed', [
                'status' => $resp->status(),
                'body' => $resp->body(),
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'OpenAI realtime-token failed',
                'status' => $resp->status(),
            ], 500);
        }

        // ✅ Normaliza respuesta (GA: normalmente viene como "value") :contentReference[oaicite:4]{index=4}
        $json = $resp->json();
        $token = $json['value'] ?? ($json['client_secret']['value'] ?? null);

        if (!$token) {
            Log::error('OpenAI realtime-token: respuesta sin token', ['json' => $json]);

            return response()->json([
                'ok' => false,
                'error' => 'OpenAI no devolvió token efímero (value/client_secret.value)',
            ], 500);
        }

        $out = [
            'ok' => true,
            'client_secret' => $token,
            'expires_at' => $json['expires_at'] ?? null,
        ];

        if (config('app.debug')) {
            $out['raw'] = $json; // evita en prod si no lo necesitas
        }

        return response()->json($out);
    }

    public function ask(Request $request)
    {
        $pregunta = trim((string) $request->input('pregunta', ''));
        $sessionId = trim((string) $request->input('session_id', 'web'));

        if ($pregunta === '') {
            return response()->json(['ok' => false, 'error' => 'Pregunta vacía'], 422);
        }

        $endpoint = config('services.mini_tes.graphql_url', 'http://127.0.0.1:4000/graphql');

        $query = <<<'GQL'
query($pregunta: String!, $session_id: String) {
  asistente(pregunta: $pregunta, session_id: $session_id)
}
GQL;

        try {
            $resp = Http::timeout(60)->acceptJson()->post($endpoint, [
                'query' => $query,
                'variables' => [
                    'pregunta' => $pregunta,
                    'session_id' => $sessionId,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => 'No se pudo conectar al API (exception)',
                'details' => $e->getMessage(),
            ], 502);
        }

        if (!$resp->successful()) {
            return response()->json([
                'ok' => false,
                'error' => 'No se pudo conectar al API',
                'details' => $resp->body(),
            ], 502);
        }

        $json = $resp->json();

        if (isset($json['errors']) && is_array($json['errors'])) {
            return response()->json([
                'ok' => false,
                'error' => $json['errors'][0]['message'] ?? 'Error GraphQL',
                'details' => $json['errors'],
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'respuesta' => $json['data']['asistente'] ?? '',
        ]);
    }
}
