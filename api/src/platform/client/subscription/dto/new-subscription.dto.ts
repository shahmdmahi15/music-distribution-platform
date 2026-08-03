export enum BusinessType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export class NewSubscriptionDto {
  businessType!: BusinessType;
  companyName!: string;
  companyWebsite!: string;
  country!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  instagramHandle!: string;
  howManyArtistsInRoaster!: number;
  howManyYearsInBusiness!: number;
  isYourBusinessIncorporated!: boolean;
  howManyTracksInYourCatalog!: number;
  howManyTracksYouDeliverPerMonth!: number;
  averageMonthlyCatalogRevenue!: number;
  doYouHaveDirectDealsWithStreamingPlatforms!: boolean;
  distributorCurrentlyUsing!: string;
  whatIsYoureCurrentRoyaltySolution!: string;
}
