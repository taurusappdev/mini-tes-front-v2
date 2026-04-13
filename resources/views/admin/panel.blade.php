@extends('layouts.admin')

@section('title', 'Panel | Mini-TES')
@section('page_title', 'Panel')
@section('page_subtitle', 'Home de aplicaciones (estilo TES)')

@section('content')
  <div class="grid">
    <div class="card">
      <h3>Planeación</h3>
      <p class="muted">Planificador V1 end-to-end con GraphQL.</p>
      <a class="btn" href="{{ route('admin.planeacion') }}">Entrar</a>
    </div>

    <div class="card">
      <h3>Checklists</h3>
      <p class="muted">Placeholder (siguiente caso TES).</p>
      <a class="btn" href="{{ route('admin.checklists') }}">Abrir</a>
    </div>

    <div class="card">
      <h3>Tareas</h3>
      <p class="muted">Placeholder.</p>
      <a class="btn" href="{{ route('admin.tareas') }}">Abrir</a>
    </div>

    <div class="card">
      <h3>Acciones</h3>
      <p class="muted">Placeholder.</p>
      <a class="btn" href="{{ route('admin.acciones') }}">Abrir</a>
    </div>

    <div class="card">
      <h3>Dashboard</h3>
      <p class="muted">Placeholder.</p>
      <a class="btn" href="{{ route('admin.dashboard') }}">Abrir</a>
    </div>
  </div>
@endsection
