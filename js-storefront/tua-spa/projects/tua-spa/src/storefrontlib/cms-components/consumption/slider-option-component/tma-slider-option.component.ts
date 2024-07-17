// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import {
  AfterViewChecked,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { MediaService } from '@spartacus/storefront';

@Component({
  selector: 'cx-slider-option',
  templateUrl: './tma-slider-option.component.html',
  styleUrls: ['./tma-slider-option.component.scss']
})
export class TmaSliderOptionComponent implements OnInit, AfterViewChecked {

  @Input()
  consumption: string;

  @Input()
  sliderOptions: any;
  
  @Input()
  usageUnit?: string;

  @Input()
  billingFrequency?: string;

  @Output()
  consumptionValue = new EventEmitter<number>();

  mediaValues = [];
  sliderValues = [];
  selectedValue: number;
  minValue: number;
  maxValue: number;
  checked: boolean[] = [];

  constructor(protected mediaService: MediaService) {
  }

  ngOnInit(): void {
    this.sliderOptions.forEach(option => {
      this.sliderValues.push(option.value);
    });
    this.minValue = Math.min(...this.sliderValues);
    this.maxValue = Math.max(...this.sliderValues);
    this.selectedValue = Number(this.consumption);
  }

  ngAfterViewChecked(): void {
    this.updateSlider();
  }

  /**
   * Updates the value of the slider to a new value of the slider.
   *
   * @param index - the index of the new value
   */
  changeOptionValue(selectedValue: number): void {
    this.consumptionValue.emit(selectedValue);
  }

  protected updateSlider(): void {
    const consumption: number = Number(this.consumption);
    this.selectedValue = consumption;
  }
}
