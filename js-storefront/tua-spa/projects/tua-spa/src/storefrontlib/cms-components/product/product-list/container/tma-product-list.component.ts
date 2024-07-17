// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { Component, ComponentRef, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Params, UrlSegment } from '@angular/router';
import { CmsService, ContentSlotComponentData, GlobalMessageService, Page } from '@spartacus/core';
import { LAUNCH_CALLER, LaunchDialogService, PageLayoutService, ProductListComponent, ViewConfig } from '@spartacus/storefront';
import {
  SEPARATOR,
  TmaCmsConsumptionComponent,
  TmaConsumptionChangeService,
  TmaConsumptionConfig,
  TmaConsumptionValue,
  TmaProductListComponentService,
  TmaProductSearchService
} from '../../../../../core';
import { Observable, Subject, Subscription } from 'rxjs';
import { first, take } from 'rxjs/operators';

@Component({
  selector: 'cx-product-list',
  templateUrl: './tma-product-list.component.html',
  styleUrls: ['./tma-product-list.component.scss']
})
export class TmaProductListComponent extends ProductListComponent implements OnInit, OnDestroy {

  @ViewChild('consumptionValue', { static: false })
  consumptionValue: ElementRef;

  url$: Observable<UrlSegment[]>;
  page$: Observable<Page>;
  isConsumptionOpen: boolean = false;

  protected queryParams: Params;
  protected consumption: number;
  protected subscriptions = new Subscription();

  protected queryParamsSubject: Subject<Params>;

  constructor(
    pageLayoutService: PageLayoutService,
    productListComponentService: TmaProductListComponentService,
    globalMessageService: GlobalMessageService,
    public scrollConfig: ViewConfig,
    protected consumptionChangeService: TmaConsumptionChangeService,
    protected launchDialogService: LaunchDialogService,
    protected vcr: ViewContainerRef,
    public productSearchService?: TmaProductSearchService,
    protected consumptionConfig?: TmaConsumptionConfig,
    protected activatedRoute?: ActivatedRoute,
    protected cmsService?: CmsService,
  ) {
    super(pageLayoutService, productListComponentService, globalMessageService, scrollConfig);
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (this.activatedRoute && this.cmsService) {
      this.url$ = this.activatedRoute.url;
      this.page$ = this.cmsService.getCurrentPage();

      this.activatedRoute.queryParams
      .subscribe((params: Params) => this.queryParams = params);
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.queryParamsSubject) {
      this.queryParamsSubject.unsubscribe();
    }
    this.subscriptions?.unsubscribe();
  }

  openConsumptionAccordion(): void {
    this.isConsumptionOpen = !this.isConsumptionOpen;
  }

  /**
   * Displays the consumption component.
   */
  updateConsumption(consumptionComponent: TmaCmsConsumptionComponent): void {
    this.openModal(consumptionComponent);
  }

  /**
   * Returns the formatted form of the consumption component provided.
   *
   * @param consumptionComponent The consumption to be formatted
   * @return String containing the formatted consumption
   */
  getFormattedConsumptionList(consumptionComponent: TmaCmsConsumptionComponent): string[] {
    if (!consumptionComponent ||
      !consumptionComponent.searchByConsumptionComponents) {
      return [];
    }

    const keyValueList: string[] = Object.keys(consumptionComponent.searchByConsumptionComponents);

    if (!keyValueList || keyValueList.length < 1) {
      return [];
    }

    const consumptionDisplayList: string[] = [];

    keyValueList.forEach((keyValue: string) => {
      const consumptionDetails = consumptionComponent.searchByConsumptionComponents[keyValue];

      consumptionDisplayList.push(
        this.getConsumption(consumptionDetails.productSpecification.id, consumptionDetails.usageUnit.id)
        + ' ' + consumptionDetails.usageUnit.name
        + '/' + consumptionDetails.billingFrequency
      );
    });

    return consumptionDisplayList;
  }

  /**
   * Retrieves the consumption component on the page.
   * @param page The current page
   * @return The component as {@link TmaCmsConsumptionComponent}
   */
  getConsumptionComponent(page: Page): TmaCmsConsumptionComponent {
    const consumptionSlotKey: string = Object.keys(page.slots)
      .find((key: string) => page.slots[key].components && page.slots[key].components.find((component: ContentSlotComponentData) => component.typeCode === 'ConsumptionListComponent'));
    if (!consumptionSlotKey) {
      return null;
    }

    const consumptionSlot = page.slots[consumptionSlotKey];

    const consumptionComponentList: TmaCmsConsumptionComponent[] = [];
    consumptionSlot.components.forEach((component: ContentSlotComponentData) => {
      this.cmsService.getComponentData(component.uid)
        .pipe(first((consumptionComponent: TmaCmsConsumptionComponent) => consumptionComponent != null))
        .subscribe((consumptionComponent: TmaCmsConsumptionComponent) => consumptionComponentList.push(consumptionComponent));
    });

    if (!consumptionComponentList || consumptionComponentList.length === 0) {
      return null;
    }

    return consumptionComponentList[0];
  }

  protected getConsumption(productSpecification: string, usageUnit: string): string {
    let consumption: string = null;
    this.activatedRoute.queryParams.subscribe(params => {
      consumption = params['consumption'];
    });

    if (consumption) {
      this.consumption = Number(consumption);
      return consumption;
    }

    const consumptionFromLocalStorage = localStorage.getItem('consumption' + SEPARATOR + productSpecification + SEPARATOR + usageUnit);

    if (consumptionFromLocalStorage) {
      return consumptionFromLocalStorage;
    }

    const defaultConsumptionValue = this.consumptionConfig.consumption.defaultValues.find((consumptionValue: TmaConsumptionValue) => consumptionValue.productSpecification === productSpecification && consumptionValue.usageUnit === usageUnit);
    if (!defaultConsumptionValue) {
      const consumptionValue = this.consumptionConfig.consumption.default;
      localStorage.setItem('consumption' + SEPARATOR + productSpecification + SEPARATOR + usageUnit, consumptionValue);
      return consumptionValue;
    }

    localStorage.setItem('consumption' + SEPARATOR + productSpecification + SEPARATOR + usageUnit, defaultConsumptionValue.value);
    return defaultConsumptionValue.value;
  }

  protected openModal(consumptionComponent: TmaCmsConsumptionComponent) {
    const modalInstanceData = {
      consumptionComponent: consumptionComponent,
      queryParams: this.queryParams,
    };
    const dialog = this.launchDialogService.openDialog(
      LAUNCH_CALLER.TMA_CONSUMPTION,
      undefined,
      this.vcr,
      modalInstanceData
    );
    if (dialog) {
      this.subscriptions.add(
        dialog.pipe(take(1)).subscribe((res: ComponentRef<any>) => {
          const consumption = res.instance.consumptionValue;
          if(consumption) {
            this.consumptionValue.nativeElement.innerText = this.getFormattedConsumptionList(consumptionComponent);
          }
        })
      );
    }
  }
}
