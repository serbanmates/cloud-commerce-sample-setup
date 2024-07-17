// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import {
  BaseSiteService,
  CmsService,
  ContentSlotComponentData,
  CurrencyService,
  GlobalMessageService,
  GlobalMessageType,
  OCC_USER_ID_ANONYMOUS,
  Page,
  ProductService,
  TranslationService,
  User
} from '@spartacus/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, take } from 'rxjs/operators';
import {
  GeographicAddress,
  GeographicAddressService,
  JourneyChecklistConfig,
  LogicalResource,
  LogicalResourceReservationService,
  LogicalResourceType,
  TmaActiveCartFacade,
  TmaBillingFrequencyConfig,
  TmaCartPriceService,
  TmaCharacteristic,
  TmaChecklistAction,
  TmaChecklistActionService,
  TmaChecklistActionTypeCheckService,
  TmaCmsConsumptionComponent,
  TmaConsumptionChangeService,
  TmaGeographicAddressConverter,
  TmaInstallationAddressConverter,
  TmaItem,
  TmaPlace,
  TmaPlaceRole,
  TmaPremiseDetail,
  TmaPremiseDetailInteractionService,
  TmaPremiseDetailService,
  TmaPriceService,
  TmaProcessTypeEnum,
  TmaProduct,
  TmaProductService,
  TmaRelatedParty,
  TmaRelatedPartyRole,
  TmaSubscribedProduct,
  TmaTechnicalResource,
  TmaTechnicalResources,
  TmaTmfCartService,
  TmaTechnicalDetails,
  TmaTmfShoppingCart,
  TmaServiceProviderDetails
} from '../../../../../core';
import { TmaUserAddressService } from '../../../../../core/user/facade/tma-user-address.service';
import { CartItemContext } from '@spartacus/cart/base/root';
import { CartItemComponent, CartItemContextSource } from '@spartacus/cart/base/components';
import { LaunchDialogService } from '@spartacus/storefront';
import { LOCAL_STORAGE } from '../../../../../core/util/constants';
import { SelfcareService } from '../../../../../core/selfcare';
import { UserAccountFacade } from '@spartacus/user/account/root';

const { TECHNICAL_ID, AVERAGE_CONSUMPTION_ESTIMATION } = LOCAL_STORAGE.SUBSCRIBED_PRODUCT.CHARACTERISTIC;
const { MOVE,
  SWITCH_PROVIDER
} = LOCAL_STORAGE.REASON_FOR_PURCHASE;
const { PURCHASE_WITH_ASSURANCE_FEATURE
} = LOCAL_STORAGE.TMA_FEATURE_FLAGS

@Component({
  selector: 'cx-cart-item',
  templateUrl: './tma-cart-item.component.html',
  styleUrls: ['./tma-cart-item.component.scss'],
  providers: [
    CartItemContextSource,
    { provide: CartItemContext, useExisting: CartItemContextSource },
  ],
  animations: [
    trigger('slideInOut', [
      state('false', style({ height: '0px', overflow: 'hidden' })),
      state('true', style({ height: '*' })),
      transition('1 => 0', animate('500ms ease-in')),
      transition('0 => 1', animate('500ms ease-out'))
    ])
  ]
})
export class TmaCartItemComponent extends CartItemComponent implements OnInit, OnDestroy {

  @ViewChild('consumptionValue', { static: false })
  consumptionValue: ElementRef;

  @ViewChild('averageCostPerMonth', { static: false })
  averageCostPerMonth: ElementRef;

  @ViewChild('averageCostPerYear', { static: false })
  averageCostPerYear: ElementRef;


  @Input()
  item: TmaItem;

  @Input()
  displayPrices = true;

  @Input()
  isRemovable: boolean;

  @Input()
  showEdit?: boolean;

  @Input()
  showConsumption?= true;

  @Input()
  qtyDisabled = false;

  @Input()
  isPremiseDetailsReadOnly: boolean;

  @Input()
  isAddedToCartDialog?: boolean = false;

  @Input()
  enableChecklistActions?: boolean = true;

  @Input()
  isEdit?: boolean = false;

  @Output()
  tmaItem = new EventEmitter<any>();

  page$: Observable<Page>;
  premiseDetails: TmaPremiseDetail;
  serviceProvider: string;
  product$: Observable<TmaProduct>;
  currency$: Observable<string>;
  itemLogicalResources: LogicalResource[];
  checklistAction$: TmaChecklistAction[];
  url$: Observable<UrlSegment[]>;
  geographicAddress$: Observable<GeographicAddress>;
  place: TmaPlace;
  detailedPlace: GeographicAddress;
  toggleEditButton: boolean = true;
  consumptionUsage: {unit: string, billingFrequency: string};

  protected subscription = new Subscription();
  protected baseSiteId: string;
  protected consumption: number;
  protected isCurrentSelectionExpanded: boolean;
  protected currentUser: User;
  protected currentBaseSiteId: string;
  protected readonly PURCHASE_WITH_ASSURANCE_FEATURE = PURCHASE_WITH_ASSURANCE_FEATURE;

  constructor(
    public cartPriceService: TmaCartPriceService,
    public checklistActionTypeCheckService: TmaChecklistActionTypeCheckService,
    protected currencyService: CurrencyService,
    protected cartItemContextSource: CartItemContextSource,
    protected launchDialogService: LaunchDialogService,
    protected vcr: ViewContainerRef,
    protected consumptionChangeService: TmaConsumptionChangeService,
    public productSpecificationProductService?: TmaProductService,
    public priceService?: TmaPriceService,
    protected logicalResourceReservationService?: LogicalResourceReservationService,
    protected cartService?: TmaActiveCartFacade,
    protected tmaUserAddressService?: TmaUserAddressService,
    protected tmaPremiseDetailService?: TmaPremiseDetailService,
    protected globalMessageService?: GlobalMessageService,
    protected tmaChecklistActionService?: TmaChecklistActionService,
    protected installationAddressConverter?: TmaInstallationAddressConverter,
    protected geographicAddressConverter?: TmaGeographicAddressConverter,
    protected translationService?: TranslationService,
    protected productService?: ProductService,
    protected premiseDetailInteractionService?: TmaPremiseDetailInteractionService,
    protected baseSiteService?: BaseSiteService,
    protected config?: JourneyChecklistConfig,
    protected cmsService?: CmsService,
    protected billingFrequencyConfig?: TmaBillingFrequencyConfig,
    protected activatedRoute?: ActivatedRoute,
    protected selfcareService?: SelfcareService,
    protected geographicAddressService?: GeographicAddressService,
    protected userAccountFacade?: UserAccountFacade,
    protected tmaTmfCartService?: TmaTmfCartService,
    protected changeDetectorRef?: ChangeDetectorRef
  ) {
    super( cartItemContextSource);
    this.subscription.add(
      this.userAccountFacade
        .get()
        .pipe(
          first((user: User) => user != null)
        )
        .subscribe((user: User) => (this.currentUser = user))
    );

    this.subscription.add(
      this.baseSiteService
        .getActive()
        .pipe(
          first((baseSiteId: string) => baseSiteId != null)
        )
        .subscribe((baseSiteId: string) => (this.currentBaseSiteId = baseSiteId))
    );
  }

  ngOnInit(): void {
    this.product$ = this.productService.get(this.item.product.code);
    this.serviceProvider = this.getServiceProvider(this.item);
    this.url$ = this.activatedRoute.url;
    this.page$ = this.cmsService.getCurrentPage();
    this.currency$ = this.currencyService.getActive();

    this.itemLogicalResources = this.getLogicalResources(
      this.item.subscribedProduct.characteristic
    );
    this.subscription.add(
      this.baseSiteService
        .getActive()
        .pipe(
          first((baseSiteId: string) => !!baseSiteId)
        )
        .subscribe((baseSiteId: string) => (this.baseSiteId = baseSiteId))
    );

    if (this.enableChecklistActions) {
      this.subscription.add(
        this.tmaChecklistActionService.getChecklistActionForProductCode(
            this.baseSiteId,
            this.item.product.code,
            this.item.processType.id
        ).pipe(
            take(2),
            filter((checklistResult: TmaChecklistAction[]) => !!checklistResult),
            distinctUntilChanged(),
            map((checklistResult: TmaChecklistAction[]) => {
              if (Object.keys(checklistResult).length !== 0) {
                const journeyCheckLists: TmaChecklistAction[] = checklistResult.filter(
                    (checklist: TmaChecklistAction) =>
                        this.config.journeyChecklist.journeyChecklistSteps.includes(
                            checklist.actionType
                        )
                );
                if (Object.keys(journeyCheckLists).length !== 0) {
                  this.checklistAction$ = journeyCheckLists;
                } else {
                  this.checklistAction$ = undefined;
                }
              } else {
                this.checklistAction$ = undefined;
              }
            })
        )
            .subscribe()
      );
    }
    else {
      this.checklistAction$ = undefined;
    }

    this.place = this.item && this.item.subscribedProduct && this.item.subscribedProduct.place ?
      this.item.subscribedProduct.place.find((address: TmaPlace) => address.role === TmaPlaceRole.INSTALLATION_ADDRESS) : null;

    if (this.place !== null)
    {
      this.geographicAddress$ = this.geographicAddressService.getGeographicAddress(this.baseSiteId, this.place.id);
      this.subscription.add(
        combineLatest([
          this.geographicAddress$,
          this.product$
          ]).pipe(
          filter(([address, product]) => address !== undefined && product !== undefined)
        ).subscribe(([address, product]) => {
          this.detailedPlace = address;
          this.premiseDetails = this.getPremiseDetails(product);
          this.changeDetectorRef.detectChanges();
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  removeItem() {
    if (!!this.itemLogicalResources) {
      this.logicalResourceReservationService.clearInvalidReservations(
        this.itemLogicalResources
      );
    }
    super.removeItem();
  }

  /**
   * Updates the cart entry with switch service provider information.
   *
   * @param serviceProvider - The current service provider
   */
  onUpdateServiceProvider(serviceProvider: TmaServiceProviderDetails): void {
    const shoppingCart: TmaTmfShoppingCart = {
      baseSiteId: this.currentBaseSiteId,
      cartItem: [
        {
          id: this.item.entryNumber.toString(),
          processType: {
            id: TmaProcessTypeEnum.ACQUISITION
          },
          contractStartDate: serviceProvider.contractDate
        },
      ],
      relatedParty: [
        {
          id: this.getCurrentUserId()
        }
      ]
    };
    if (serviceProvider.processType === TmaProcessTypeEnum.SWITCH_SERVICE_PROVIDER) {
      shoppingCart.cartItem[0].processType.id = TmaProcessTypeEnum.SWITCH_SERVICE_PROVIDER;
      shoppingCart.cartItem[0]['product'] = {
        relatedParty: [
          {
            id: serviceProvider.serviceProviderName, role: TmaRelatedPartyRole.SERVICE_PROVIDER
          }
        ]
      }
    }

    this.tmaTmfCartService.updateCart(shoppingCart);
  }

  validatePremiseDetails(premiseDetails: TmaPremiseDetail): void {
    const validationResult = this.tmaPremiseDetailService.validatePremiseDetails(premiseDetails);
    this.subscription.add(
      validationResult
        .pipe(
          filter((result: TmaTechnicalResources) => !!result)
        )
        .subscribe((result: TmaTechnicalResources) => {
          const consumption: string = this.getAverageConsumption(this.item.subscribedProduct);
          if (this.checkPremiseValidity(result)) {
            const shoppingCart: TmaTmfShoppingCart = {
              baseSiteId: this.currentBaseSiteId,
              cartItem: [
                {
                  id: this.item.entryNumber.toString(),
                  product: {
                    characteristic: [
                      {
                        name: TECHNICAL_ID,
                        value: premiseDetails.technicalDetails.id
                      },
                      {
                        name: AVERAGE_CONSUMPTION_ESTIMATION,
                        value: consumption
                      }
                    ]
                  }
                }
              ],
              relatedParty: [
                {
                  id: this.getCurrentUserId()
                }
              ]
            };

            this.tmaTmfCartService.updateCart(shoppingCart);
            this.tmaUserAddressService.updateUserAddress(this.getAddressId(this.item), this.installationAddressConverter.convertSourceToTarget(premiseDetails.installationAddress));
            this.premiseDetailInteractionService.updatePremiseDetail({
              premiseDetails: premiseDetails,
              entryNumber: this.item.entryNumber
            });
            this.premiseDetails = premiseDetails;
          }
          else {
            this.subscription.add(
              this.translationService.translate('premiseDetails.premiseDetailsValidation.fail')
                .subscribe((translatedMessage: string) => this.globalMessageService.add(translatedMessage, GlobalMessageType.MSG_TYPE_ERROR))
            );
          }
        })
    );
  }

  /**
   * Returns the currently selected purchase reason.
   *
   * @return The purchase reason as {@link string}
   */
  getPurchaseReason(): string {
    return this.item.processType.id === TmaProcessTypeEnum.SWITCH_SERVICE_PROVIDER ? SWITCH_PROVIDER : MOVE;
  }

  /**
   * Returns the premise details based on information from cart item and product.
   *
   * @param product - The product offering
   * @return The premise details as {@link TmaPremiseDetail}
   */
  getPremiseDetails(product: TmaProduct): TmaPremiseDetail {
    return {
      installationAddress: undefined,
      technicalDetails: this.getTechnicalDetails(product)
    };
  }

  /**
   * Checks if the cart item has installation address
   *
   * @return True {@link boolean} if cart item has installation address, otherwise false
   */
  hasInstallationAddress(): boolean {
    return !!(this.item &&
      this.item.subscribedProduct &&
      this.item.subscribedProduct.place &&
      this.item.subscribedProduct.place.find((place: TmaPlace) => place.role === TmaPlaceRole.INSTALLATION_ADDRESS));
  }

  /**
   * Checks if appointment is present in cart item
   *
   * @return True {@link boolean} if cart item has appointment, otherwise false
   */
  hasAppointment(): boolean {
    return !!(this.item.appointment && this.item.appointment.id);
  }

  /**
   * Checks if logical resource MSISDN present in cart item
   *
   * @return True {@link boolean} if cart item has logical resource MSISDN, otherwise false
   */
  isLogicalResourceMsisdn(): boolean {
    return !!(this.item &&
      this.item.subscribedProduct &&
      this.item.subscribedProduct.characteristic &&
      this.item.subscribedProduct.characteristic.find((tmaCharacteristic: TmaCharacteristic) => tmaCharacteristic.name === LogicalResourceType.MSISDN));
  }

  /**
   * Check Logical Resource present in cart item
   *
   * @return a {@link LogicalResource}
   */
  hasLogicalResource(item: TmaItem): LogicalResource[] {
    if (item &&
      item.subscribedProduct &&
      item.subscribedProduct.characteristic) {
      return this.getLogicalResources(
        item.subscribedProduct.characteristic
      );
    }
    return [];
  }

  getTechnicalDetails(product: TmaProduct): TmaTechnicalDetails {
    return this.item && this.item.subscribedProduct && this.item.subscribedProduct.characteristic ? {
      id: this.getValueOfTechnicalId(this.item.subscribedProduct),
      type: product.productSpecification?.id
    } : null;
  }

   /**
   * Toggle the consumption component
   */
  editConsumption(): void {
    this.toggleEditButton = !this.toggleEditButton;
  }

  /**
   * Retrieves the consumption component based on the product's product specification
   *
   * @param page The current page
   * @param product The provided product
   * @return The consumption component as {@link TmaCmsConsumptionComponent}
   */
  getConsumptionComponent(page: Page, product: TmaProduct): TmaCmsConsumptionComponent {
    const consumptionSlotKey: string = Object.keys(page.slots)
      .find((key: string) => page.slots[key]?.components?.find((component: ContentSlotComponentData) => component.typeCode === 'ConsumptionListComponent'));

    if (!consumptionSlotKey) {
      return null;
    }

    const consumptionSlot = page.slots[consumptionSlotKey];

    const consumptionComponentList: TmaCmsConsumptionComponent[] = [];
    consumptionSlot.components.forEach((component: ContentSlotComponentData) => {
      this.cmsService.getComponentData(component.uid)
        .pipe(first((consumptionComp: TmaCmsConsumptionComponent) => consumptionComp != null))
        .subscribe((consumptionComp: TmaCmsConsumptionComponent) => consumptionComponentList.push(consumptionComp));
    });

    if (!consumptionComponentList || consumptionComponentList.length === 0) {
      return null;
    }

    const keyValueList: string[] = Object.keys(consumptionComponentList[0].searchByConsumptionComponents);

    if (!keyValueList || keyValueList.length < 1) {
      return null;
    }

    const consumptionComponent: TmaCmsConsumptionComponent = Object.assign({}, consumptionComponentList[0]);
    consumptionComponent.searchByConsumptionComponents = [];

    keyValueList.forEach((keyValue: string) => {
      if (consumptionComponentList[0].searchByConsumptionComponents[keyValue].productSpecification.id === product.productSpecification.id) {
        consumptionComponent.searchByConsumptionComponents[keyValue] = consumptionComponentList[0].searchByConsumptionComponents[keyValue];
      }
    });
    return consumptionComponent;
  }


  /**
   * Returns the average estimated consumption
   *
   * @return average estimated consumption as {@link String}
   */
  getConsumptionEstimated(): string {
    if (this.item &&
      this.item.subscribedProduct &&
      this.item.subscribedProduct.characteristic) {
      return this.getAverageConsumption(
        this.item.subscribedProduct
      );
    }
    return '';
  }

  /**
   * Expands the current selections.
   */
   expandCurrentSelection(): void {
    this.isCurrentSelectionExpanded = true;
  }

  /**
   * Collapses current selections.
   */
  collapseCurrentSelection(): void {
    this.isCurrentSelectionExpanded = false;
  }

  /**
   * Returns if current selection is collapsed.
   *
   * @return True if current selection is collapsed, otherwise false
   */
  isCurrentSelectionCollapsed(): boolean {
    return !this.isCurrentSelectionExpanded;
  }

/**
 * Checks for the given cart entries have the process type as renewal.
 *
 * @param items - The cart items
 *
 * @return true if cart item has process type as renewal as a {@link boolean}
 */
  isCartEntryForRenewal(items: TmaItem[]): boolean {
    const renewItem = items.find(
      (item: TmaItem) =>
        item.processType !== undefined &&
        item.processType.id === TmaProcessTypeEnum.RENEWAL
    );
    return renewItem !== undefined;
  }

  /**
   * Get the string with the usage unit and the billing frequency of the selected consumption
   *
   * @param product - The provided product
   * @param consumptionComponent - The provided consumption component
   * @returns a string with the usage unit and billing frequency
   */
  getUsageUnitAndBillingFrequency(product: TmaProduct, consumptionComponent: TmaCmsConsumptionComponent): string {
    if (!product || !consumptionComponent) {
      return null;
    }
    const keyValueList: string[] = Object.keys(consumptionComponent.searchByConsumptionComponents);
    if (!keyValueList || keyValueList.length < 1 || !product.productSpecification) {
      return null;
    }
    const keyForConsumptionComponent = keyValueList.find((keyValue: string) => {
      if (consumptionComponent.searchByConsumptionComponents[keyValue].productSpecification) {
        return consumptionComponent.searchByConsumptionComponents[keyValue].productSpecification.id === product.productSpecification.id;
      }
      return null;
    }
    );
    if (keyForConsumptionComponent &&
      consumptionComponent.searchByConsumptionComponents[keyForConsumptionComponent] &&
      consumptionComponent.searchByConsumptionComponents[keyForConsumptionComponent].usageUnit
    ) {
      return consumptionComponent.searchByConsumptionComponents[keyForConsumptionComponent].usageUnit.name + '/'
        + consumptionComponent.searchByConsumptionComponents[keyForConsumptionComponent].billingFrequency;
    }
    return null;
  }

  protected checkPremiseValidity(validationResult: TmaTechnicalResources): boolean {
    return !!(validationResult.technicalResources && validationResult.technicalResources.find((result: TmaTechnicalResource) => !!result));
  }

  protected getServiceProvider(item: TmaItem): string {
    this.serviceProvider = item &&
      item.subscribedProduct &&
      item.subscribedProduct.relatedParty ?
      item.subscribedProduct.relatedParty.find((relatedParty: TmaRelatedParty) => relatedParty.role === TmaRelatedPartyRole.SERVICE_PROVIDER).id :
      null;
    return this.serviceProvider;
  }

  protected getAddressId(item: TmaItem): string {
    return item && item.subscribedProduct && item.subscribedProduct.place ?
      item.subscribedProduct.place.find((place: TmaPlace) => place.role === TmaPlaceRole.INSTALLATION_ADDRESS).id : '';
  }

  protected getLogicalResources(
    characteristics: TmaCharacteristic[]
  ): LogicalResource[] {
    const logicalResources: LogicalResource[] = [];
    if (!characteristics) {
      return[];
    }
    characteristics.forEach((characteristic: TmaCharacteristic) => {
      if (
        !!characteristic.name &&
        Object.values(LogicalResourceType).includes(
          LogicalResourceType[characteristic.name.toUpperCase()]
        )
      ) {
        const logicalResource: LogicalResource = {};
        logicalResource.type =
          LogicalResourceType[characteristic.name.toUpperCase()];
        logicalResource.value = characteristic.value;
        logicalResources.push(logicalResource);
      }
    });
    return logicalResources;
  }

  private getValueOfTechnicalId(subscribedProduct: TmaSubscribedProduct): string {
    const characteristic = subscribedProduct.characteristic.find((tmaCharacteristic: TmaCharacteristic) =>
      tmaCharacteristic.name === TECHNICAL_ID);
    if (characteristic) {
      return characteristic.value;
    }
    return '';
  }

  private getAverageConsumption(
    subscribedProduct: TmaSubscribedProduct
  ): string {
    if (subscribedProduct.characteristic) {
      const characteristic = subscribedProduct.characteristic.find(
        (tmaCharacteristic: TmaCharacteristic) =>
          tmaCharacteristic.name === AVERAGE_CONSUMPTION_ESTIMATION
      );
      if (characteristic) {
        return characteristic.value;
      }
    }
    return '';
  }

  private getCurrentUserId(): string {
    const currentUserId: string =
      this.currentUser && this.currentUser.uid
        ? this.currentUser.uid
        : OCC_USER_ID_ANONYMOUS;
    return currentUserId
  }

  getTechnicalId(item: TmaItem): string {
    if(item.subscribedProduct !== null && item.subscribedProduct.characteristic !== null){
      return item.subscribedProduct.characteristic.find(value => value.name === TECHNICAL_ID).value.toString();
    }
    return null;
  }

  hasTechnicalId(): boolean {
    return !!(this.item &&
      this.item.subscribedProduct &&
      this.item.subscribedProduct.characteristic &&
      this.item.subscribedProduct.characteristic.find(value => value.name === TECHNICAL_ID)?.value.toString());
  }
}
