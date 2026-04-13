@extends('layouts.admin')

@section('title', 'Checklists | Mini-TES')
@section('page_title', 'Checklists')
@section('page_subtitle', 'CRUD mínimo (V1)')

@section('content')
  <div class="card" style="margin-bottom:14px;">
    <h3 style="margin:0;">Crear checklist</h3>
    <p class="muted">Valida el patrón “app dentro del Home”.</p>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
      <input id="clName" class="input" placeholder="Nombre del checklist" style="min-width:320px;">
      <button class="btn" id="btnCreate">Crear</button>
      <button class="btn" id="btnRefresh" type="button" style="background:#2C3E50;">Actualizar</button>
      <span class="muted" id="status"></span>
    </div>

    <div id="err" class="planning-error" style="display:none; margin-top:10px;"></div>
  </div>

  <div class="card">
    <h3 style="margin-top:0;">Listado</h3>

    <div style="overflow:auto; margin-top:10px;">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Creado</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody id="tbody">
          <tr><td colspan="3" class="muted">Cargando…</td></tr>
        </tbody>
      </table>
    </div>
  </div>
@endsection

@push('scripts')
<script>
  window.MINI_TES = {
    graphqlUrl: @json(config('services.mini_tes.graphql_url')),
    csrf: @json(csrf_token()),
  };
</script>

<script src="{{ asset('js/core/graphql.js') }}"></script>
<script src="{{ asset('js/apps/checklists.js') }}"></script>
@endpush
