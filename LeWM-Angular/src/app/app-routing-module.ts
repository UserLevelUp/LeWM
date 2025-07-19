import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';

const routes: Routes = [
  { path: '', redirectTo: '/nodes', pathMatch: 'full' },
  { path: 'nodes', component: GraphEditorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
