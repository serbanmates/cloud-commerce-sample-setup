// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Params } from '@angular/router';
import { TmaConsumptionConfig } from '../../../../core/config/consumption/config';
import {
  SEPARATOR,
  TmaChecklistActionType,
  TmaConsumptionValue,
  TmaItem,
  TmaPoSearchByConsumption,
  TmaSliderOption,
  TmaTmfShoppingCart
} from '../../../../core/model';
import { Store } from '@ngrx/store';
import {
  LOCAL_STORAGE,
  TmaChecklistActionAction,
  TmaChecklistActionsState,
  TmaConsumptionChangeService,
  TmaTmfCartService
} from '../../../../core';
import { OCC_USER_ID_ANONYMOUS, User } from '@spartacus/core';

const { AVERAGE_CONSUMPTION_ESTIMATION } = LOCAL_STORAGE.SUBSCRIBED_PRODUCT.CHARACTERISTIC;
@Component({
  selector: 'cx-po-search-by-consumption',
  templateUrl: './tma-po-search-by-consumption.component.html',
  styleUrls: ['./tma-po-search-by-consumption.component.scss']
})
export class TmaPoSearchByConsumptionComponent implements OnInit {

  @Input()
  poConsumption: TmaPoSearchByConsumption;

  @Input()
  isHomepage: boolean = false;

  @Input()
  url: string;

  @Input()
  queryParams: Params;

  @Input()
  isCartPage?: boolean;

  @Input()
  cartEntryConsumption?: string;

  @Input()
  isProductDetailsPage?: boolean = false;

  @Input()
  cartItem?: TmaItem;

  @Input()
  currentBaseSiteId?: string;

  @Input()
  currentUser?: User;

  @Output()
  closeModal = new EventEmitter<any>();

  sliderOptions: TmaSliderOption[] = [];
  consumption: string;

  consumptionForm: FormGroup = this.fb.group({
    consumptionInput: ['', Validators.required]
  });

  constructor(
    protected fb: FormBuilder,
    protected consumptionConfig: TmaConsumptionConfig,
    protected store: Store<TmaChecklistActionsState>,
    protected consumptionChangeService: TmaConsumptionChangeService,
    protected tmaTmfCartService: TmaTmfCartService
  ) {
  }

  ngOnInit(): void {
    this.createSliderOptionList();
    this.consumption = !this.isCartPage ?
    this.getConsumption(this.poConsumption.productSpecification.id, this.poConsumption.usageUnit.id) :
    this.cartEntryConsumption;
    this.consumptionForm['controls'].consumptionInput.setValue(this.consumption);
    this.store.dispatch(
      new TmaChecklistActionAction.ChecklistActionDetails(
        [{ type: TmaChecklistActionType.ESTIMATED_CONSUMPTION, value: this.consumption.toString() }]
      )
    );
  }

  /**
   * Updates the consumption value with a new value from slider.
   *
   * @param consumptionValue The value to be updated
   */
  sliderConsumptionValueChange(consumptionValue: number) {
    this.consumptionForm['controls'].consumptionInput.setValue(consumptionValue);
    this.consumption = String(consumptionValue);
  }

  /**
   * Updates the consumption value with a new value from input.
   *
   * @param consumptionValue The value to be updated
   */
  inputConsumptionValueChange(consumptionValue: Event) {
    this.consumption = String((consumptionValue.target as HTMLInputElement).value);
  }

  /**
   * Retrieves the text message of the button.
   *
   * @return the button message
   */
  getButtonText(): string {
    if (!this.isHomepage) {
      return 'consumption.updateAverageCost';
    }

    return 'consumption.getAvailableOffers';
  }

  /**
   * Stores the new consumption value.
   */
  saveConsumption() {
    if (this.cartItem) {
      const shoppingCart: TmaTmfShoppingCart = {
        baseSiteId: this.currentBaseSiteId,
        cartItem: [
          {
            id: this.cartItem.entryNumber.toString(),
            product: {
              characteristic: [
                {
                  name: AVERAGE_CONSUMPTION_ESTIMATION,
                  value: this.getConsumptionInput().toString()
                }
              ]
            }
          }
        ],
        relatedParty: [
          {
            id: this.currentUser ? this.currentUser.uid : OCC_USER_ID_ANONYMOUS
          }
        ]
      };

      this.tmaTmfCartService.updateCart(shoppingCart);
      return;
    }
    if (parseInt(this.getConsumptionInput(), 10) !== 0) {
      localStorage.setItem('consumption' + SEPARATOR + this.poConsumption.productSpecification.id + SEPARATOR + this.poConsumption.usageUnit.id, this.getConsumptionInput());
      this.consumptionChangeService.updateConsumption({ consumption: this.getConsumptionInput(), productSpecification: this.poConsumption.productSpecification.id });
      this.store.dispatch(
        new TmaChecklistActionAction.ChecklistActionDetails(
          [{ type: TmaChecklistActionType.ESTIMATED_CONSUMPTION, value: this.getConsumptionInput().toString() }]
        )
      );
    }
    else {
      this.consumptionForm.controls['consumptionInput'].setErrors({'incorrect': true});
    }
  }

  protected createSliderOptionList() {
    const sliderOptionsMap = new Map(Object.entries(this.poConsumption.sliderOptionComponents));

    sliderOptionsMap.forEach((value) => {
      const option: TmaSliderOption = {
        uid: value.uid,
        name: value.name,
        value: Number(value.value),
        media: {
          altText: value.media.code,
          url: value.media.url
        }
      };
      this.sliderOptions.push(option);
    });

    this.sliderOptions.sort((a, b) => (Number(a.value) > Number(b.value)) ? 1 : -1);
  }

  protected getConsumptionInput(): string {
    this.consumption = this.consumptionForm.controls.consumptionInput.value;
    return this.consumptionForm.controls.consumptionInput.value;
  }

  protected getConsumption(productSpecification: string, usageUnit: string): string {
    const consumptionFromLocalStorage = localStorage.getItem('consumption' + SEPARATOR + productSpecification + SEPARATOR + usageUnit);

    if (consumptionFromLocalStorage) {
      return consumptionFromLocalStorage;
    }

    const defaultConsumptionValue =
      this.consumptionConfig.consumption.defaultValues.find(
        (consumptionValue: TmaConsumptionValue) => consumptionValue.productSpecification === productSpecification && consumptionValue.usageUnit === usageUnit
      );
    if (!defaultConsumptionValue) {
      const consumptionValue = this.consumptionConfig.consumption.default;
      localStorage.setItem('consumption' + SEPARATOR + productSpecification + SEPARATOR + usageUnit, consumptionValue);
      return consumptionValue;
    }

    localStorage.setItem('consumption' + SEPARATOR + productSpecification + SEPARATOR + usageUnit, defaultConsumptionValue.value);
    return defaultConsumptionValue.value;
  }
}
