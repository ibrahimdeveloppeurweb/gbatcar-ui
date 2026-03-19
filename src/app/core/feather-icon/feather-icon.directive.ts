import { AfterViewInit, Directive, OnChanges, SimpleChanges } from '@angular/core';
import * as feather from 'feather-icons';

@Directive({
  selector: '[appFeatherIcon]',
  standalone: true
})
export class FeatherIconDirective implements AfterViewInit, OnChanges {

  constructor() { }

  ngAfterViewInit(): void {
    feather.replace();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-replace icons if dynamic bindings change
    setTimeout(() => feather.replace());
  }

}
