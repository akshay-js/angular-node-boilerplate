import {NgModule} from '@angular/core';
import {
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatRippleModule,
  MatToolbarModule,
  MatIconModule
} from '@angular/material';


const modules = [
  MatFormFieldModule,
  MatButtonModule,
  MatInputModule,
  MatRippleModule,
  MatToolbarModule,
  MatIconModule
];
@NgModule({
  imports: [...modules],
  exports: [...modules]
})
export class DemoMaterialModule {}
