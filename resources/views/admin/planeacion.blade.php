@extends('layouts.admin')

@section('title', 'Planeación | Mini-TES')
@section('page_title', 'Planeación')
@section('page_subtitle', 'Planificador V1 (UI → GraphQL → Mongo)')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/apps/planeacion.css') }}">
@endpush

@section('content')
  <div class="planning-wrap">
    <div class="card" style="margin-bottom:14px;">
      <div class="planning-head">
        <div>
          <h3 style="margin:0;">Códigos + Demanda</h3>
          <div class="muted">Endpoint GraphQL: <code id="gqlUrl"></code></div>
        </div>
        <div class="planning-actions">
          <a class="btn" href="{{ route('admin.panel') }}">← Volver al Panel</a>
        </div>
      </div>

      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:12px;">
        <div style="min-width:220px;">
          <label class="muted" for="minMuestras">minMuestras</label>
          <input id="minMuestras" class="input" type="number" min="0" step="1" value="12">
        </div>
      </div>
      
      <div class="muted" style="margin-top:10px;">
        Formato: <code>CODIGO,DEMANDA</code> — ejemplo:
        <br><code>M94406500,5000</code>
        <br><code>M91209432,1200</code>
      </div>

      <textarea id="input" class="input planning-textarea" placeholder="M94406500,5000&#10;M91209432,1200"></textarea>

      <div class="planning-row">
        <button class="btn" id="btnRun">Correr Planificador V1</button>
        <span class="muted" id="status"></span>
      </div>

      <div id="err" class="planning-error" style="display:none;"></div>
    </div>

    <div class="card" id="outCard" style="display:none;">
      <h3 style="margin-top:0;">Resultado</h3>

      <div id="warningsBlock" style="display:none;">
        <h4>Warnings (generales)</h4>
        <ul id="warnings" class="planning-warnings"></ul>
      </div>

      <div style="overflow:auto; margin-top:10px;">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Demanda</th>
              <th>Máquina</th>
              <th>TC</th>
              <th>Scrap</th>
              <th>Score</th>
              <th>Molde</th>
              <th>Fuente TC</th>
              <th>Warnings (asignación)</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>

      <div class="muted planning-note">
        Nota: <code>Scrap</code> y <code>TC</code pueden venir vacíos si no hay suficientes muestras para ese (código, máquina) según <code>minMuestras</code>.
      </div>
    </div>
  </div>
@endsection

@push('scripts')
<script>
  // Config “seria” desde Laravel (NO hardcode)
  window.MINI_TES = {
    graphqlUrl: @json(config('services.mini_tes.graphql_url')),
    csrf: @json(csrf_token()),
  };
</script>

<script src="{{ asset('js/core/graphql.js') }}"></script>
<script src="{{ asset('js/core/formats.js') }}"></script>
<script src="{{ asset('js/apps/planeacion.js') }}"></script>
@endpush
