use anchor_lang::prelude::*;

use crate::CarbonCredit;
use crate::Country;
use crate::EnergyUnits;
use crate::SourceType;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct InitializeCarbonCredit<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init, 
        payer = maker,
        space = CarbonCredit::INIT_SPACE,
        seeds = [b"carbon_credit".as_ref(), maker.key().as_ref()],
        bump
    )]
    pub carbon_credit: Account<'info, CarbonCredit>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeCarbonCredit<'info> {
    pub fn init_carbon_credit(
        &mut self,
        country: Country,
        price_per_carbon_credit: u16,
        value: u32,
        units: EnergyUnits,
        bumps:&InitializeCarbonCreditBumps
    ) -> Result<()> {
        let (original_carbon_credits, grid_emission_factor, grid_emission_factor_decimals) =
            self.calculate_carbon_credits(country.clone(), value.clone());
        let remaining_carbon_credits = original_carbon_credits.clone();

        self.carbon_credit.set_inner(CarbonCredit {
            country,
            value,
            units,
            source_type: SourceType::Solar,
            original_carbon_credits,
            remaining_carbon_credits,
            grid_emission_factor,
            grid_emission_factor_decimals,
            listed: false,
            maker: self.maker.key(),
            price_per_carbon_credit,
            bump:bumps.carbon_credit
        });
        Ok(())
    }

    fn calculate_carbon_credits(&self, country: Country, value: u32) -> (u16, u32, u8) {
        let (grid_emission_factor, grid_emission_factor_decimals) =
            self.get_grid_emission_factor(country);
        let original_carbon_credits = u16::try_from(value.checked_mul(grid_emission_factor).ok_or(ErrorCode::CalculationOverflow).unwrap()).unwrap();//(value * grid_emission_factor) as u16;

        (
            original_carbon_credits,
            grid_emission_factor,
            grid_emission_factor_decimals,
        )
    }

    fn get_grid_emission_factor(&self, country: Country) -> (u32, u8) {
        match country {
            Country::SouthAfrica => (928, 3),         // 0.928
            Country::China => (555, 3),               // 0.555
            Country::HongKong => (81, 2),             // 0.81
            Country::India => (708, 3),               // 0.708
            Country::Indonesia => (761, 3),           // 0.761
            Country::Japan => (506, 3),               // 0.506
            Country::Korea => (5, 1),                 // 0.5
            Country::Thailand => (445, 3),            // 0.445
            Country::Australia => (79, 2),            // 0.79
            Country::NewZealand => (977, 4),          // 0.0977
            Country::SaudiArabia => (732, 3),         // 0.732
            Country::Turkey => (481, 3),              // 0.481
            Country::UnitedArabEmirates => (4258, 4), // 0.4258
            Country::Canada => (13, 2),               // 0.13
            Country::Mexico => (449, 3),              // 0.449
            Country::UnitedStates => (45322, 5),      // 0.45322
            Country::Argentina => (313, 3),           // 0.313
            Country::Brazil => (74, 3),               // 0.074
            Country::Austria => (13286, 5),           // 0.13286
            Country::Belgium => (15313, 5),           // 0.15313
            Country::Bulgaria => (43737, 5),          // 0.43737
            Country::Croatia => (27315, 5),           // 0.27315
            Country::Cyprus => (67729, 5),            // 0.67729
            Country::CzechRepublic => (54465, 5),     // 0.54465
            Country::Denmark => (15444, 5),           // 0.15444
            Country::Estonia => (72328, 5),           // 0.72328
            Country::Finland => (13622, 5),           // 0.13622
            Country::France => (3895, 5),             // 0.03895
            Country::Germany => (37862, 5),           // 0.37862
            Country::Greece => (54901, 5),            // 0.54901
            Country::Hungary => (25298, 5),           // 0.25298
            Country::Iceland => (11, 5),              // 0.00011
            Country::Ireland => (34804, 5),           // 0.34804
            Country::Italy => (33854, 5),             // 0.33854
            Country::Latvia => (30333, 5),            // 0.30333
            Country::Lithuania => (14913, 5),         // 0.14913
            Country::Luxembourg => (13939, 5),        // 0.13939
            Country::Malta => (3706, 4),              // 0.3706
            Country::Netherlands => (45207, 5),       // 0.45207
            Country::Norway => (1118, 5),             // 0.01118
            Country::Poland => (79107, 5),            // 0.79107
            Country::Portugal => (25255, 5),          // 0.25255
            Country::Romania => (31011, 5),           // 0.31011
            Country::RussianFederation => (325, 3),   // 0.325
            Country::Serbia => (76253, 5),            // 0.76253
            Country::Slovakia => (1511, 4),           // 0.1511
            Country::Slovenia => (24385, 5),          // 0.24385
            Country::Spain => (22026, 5),             // 0.22026
            Country::Sweden => (1189, 5),             // 0.01189
            Country::Switzerland => (1182, 5),        // 0.01182
            Country::UnitedKingdom => (23314, 5),     // 0.23314
        }
    }
}
