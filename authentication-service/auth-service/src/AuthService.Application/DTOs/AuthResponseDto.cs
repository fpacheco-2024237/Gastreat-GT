namespace AuthService.Application.DTOs;

public class AuthResponseDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    // Compact user details for clients
    public UserDetailsDto User { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
}
