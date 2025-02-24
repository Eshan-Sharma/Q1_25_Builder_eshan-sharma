use anchor_lang::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient Carbon Credits")]
    InsufficientCredits,
    #[msg("Calculation Overflow")]
    CalculationOverflow,
    #[msg("Incorrect Subtraction")]
    CalculationUnderflow,
    #[msg("Value too large for u16")]
    ValueTooLargeForU16,
    #[msg("Value cannot be 0")]
    ValueZero,
    #[msg("Price cannot be 0")]
    PriceZero,
}
