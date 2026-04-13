<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class PanelController extends Controller
{
    public function panel()
    {
        return view('admin.panel');
    }

    public function planeacion()
    {
        return view('admin.planeacion');
    }

    public function checklists()
    {
        return view('admin.checklists');
    }

    public function tareas()
    {
        return view('admin.tareas');
    }

    public function acciones()
    {
        return view('admin.acciones');
    }

    public function dashboard()
    {
        return view('admin.dashboard');
    }
}
