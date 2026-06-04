using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

/// <summary>
/// DTO para los endpoints que reciben un refresh token:
///   POST /api/v1/auth/refresh
///   POST /api/v1/auth/logout
/// </summary>
public class RefreshRequestDto
{
    [Required(ErrorMessage = "El refresh token es requerido")]
    public string RefreshToken { get; set; } = string.Empty;
}
