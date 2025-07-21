import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';

const routes: Routes = [
  { path: '', redirectTo: '/node', pathMatch: 'full' },
  { path: 'node', component: GraphEditorComponent, data: { mode: 'normal' } },
  { path: 'nodes', component: GraphEditorComponent, data: { mode: 'normal' } }, // Keep for backward compatibility
  { path: 'pin', component: GraphEditorComponent, data: { mode: 'pin-edit' } },
  { path: 'connection', component: GraphEditorComponent, data: { mode: 'connection' } },
  { path: 'file', component: GraphEditorComponent, data: { mode: 'file' } }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
