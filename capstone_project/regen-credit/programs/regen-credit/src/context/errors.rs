use anchor_lang::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient Carbon Credits")]
    InsufficientCredits,
    #[msg("Calculation Overflow")]
    CalculationOverflow,
}
