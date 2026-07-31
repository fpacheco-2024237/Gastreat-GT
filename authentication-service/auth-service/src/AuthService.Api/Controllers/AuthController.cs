using AuthService.Application.DTOs;
using AuthService.Application.DTOs.Email;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController(
    IAuthService authService,
    IUserManagementService userManagementService,
    IRefreshTokenService refreshTokenService) : ControllerBase
{
    // ──────────────────────────────────────────────
    //  Helpers privados
    // ──────────────────────────────────────────────

    private async Task<bool> CurrentUserIsAdmin()
    {
        var userId = User.Claims
            .FirstOrDefault(c => c.Type == "sub" ||
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;

        if (string.IsNullOrEmpty(userId)) return false;

        var roles = await userManagementService.GetUserRolesAsync(userId);
        return roles.Contains(RoleConstants.ADMIN_ROLE);
    }

    // ──────────────────────────────────────────────
    //  Registro y Login
    // ──────────────────────────────────────────────

    /// <summary>
    /// Registra un nuevo usuario en Gastreat GT.
    /// Por defecto se asigna USER_ROLE.
    /// </summary>
    [HttpPost("register")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<RegisterResponseDto>> Register([FromBody] RegisterDto registerDto)
    {
        var result = await authService.RegisterAsync(registerDto);
        return StatusCode(201, result);
    }

    /// <summary>
    /// Inicia sesión y devuelve el JWT + refresh token.
    /// </summary>
    [HttpPost("login")]
    [IgnoreAntiforgeryToken]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var result = await authService.LoginAsync(loginDto);
        return Ok(result);
    }

    // ──────────────────────────────────────────────
    //  Tokens
    // ──────────────────────────────────────────────

    /// <summary>
    /// Rota el refresh token y devuelve un nuevo par JWT + refresh token.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto dto)
    {
        var result = await refreshTokenService.RotateAsync(dto.RefreshToken);
        return Ok(result);
    }

    /// <summary>
    /// Cierra la sesión del usuario revocando el refresh token.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequestDto dto)
    {
        await refreshTokenService.RevokeAsync(dto.RefreshToken);
        return Ok(new { success = true, message = "Sesión cerrada exitosamente" });
    }

    // ──────────────────────────────────────────────
    //  Verificación de correo
    // ──────────────────────────────────────────────

    /// <summary>
    /// Verifica el correo electrónico del usuario con el código enviado.
    /// </summary>
    [HttpPost("verify-email")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<EmailResponseDto>> VerifyEmail([FromBody] VerifyEmailDto verifyEmailDto)
    {
        var result = await authService.VerifyEmailAsync(verifyEmailDto);
        return Ok(result);
    }

    /// <summary>
    /// Reenvía el correo de verificación al usuario.
    /// </summary>
    [HttpPost("resend-verification")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<EmailResponseDto>> ResendVerification([FromBody] ResendVerificationDto resendDto)
    {
        var result = await authService.ResendVerificationEmailAsync(resendDto);

        if (!result.Success)
        {
            if (result.Message.Contains("no encontrado", StringComparison.OrdinalIgnoreCase))
                return NotFound(result);

            if (result.Message.Contains("ya ha sido verificado", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("ya verificado", StringComparison.OrdinalIgnoreCase))
                return BadRequest(result);

            return StatusCode(503, result);
        }

        return Ok(result);
    }

    // ──────────────────────────────────────────────
    //  Recuperación de contraseña
    // ──────────────────────────────────────────────

    /// <summary>
    /// Envía el correo de recuperación de contraseña.
    /// Siempre responde success por seguridad (aunque el email no exista).
    /// </summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<EmailResponseDto>> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
    {
        var result = await authService.ForgotPasswordAsync(forgotPasswordDto);

        if (!result.Success)
            return StatusCode(503, result);

        return Ok(result);
    }

    /// <summary>
    /// Restablece la contraseña usando el token enviado por correo.
    /// </summary>
    [HttpPost("reset-password")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<EmailResponseDto>> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
    {
        var result = await authService.ResetPasswordAsync(resetPasswordDto);
        return Ok(result);
    }

    // ──────────────────────────────────────────────
    //  Perfil del usuario autenticado
    // ──────────────────────────────────────────────

    /// <summary>
    /// Obtiene el perfil del usuario autenticado desde el JWT.
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<object>> GetProfile()
    {
        var userId = User.Claims
            .FirstOrDefault(c => c.Type == "sub" ||
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "Token inválido" });

        var user = await authService.GetUserByIdAsync(userId);
        if (user == null)
            return NotFound(new { success = false, message = "Usuario no encontrado" });

        return Ok(new { success = true, message = "Perfil obtenido exitosamente", data = user });
    }

    /// <summary>
    /// Obtiene el perfil de cualquier usuario por su ID.
    /// Usado internamente por otros microservicios de Gastreat GT (server-admin Node.js).
    /// </summary>
    [HttpPost("profile/by-id")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<object>> GetProfileById([FromBody] GetProfileByIdDto request)
    {
        if (string.IsNullOrEmpty(request.UserId))
            return BadRequest(new { success = false, message = "El userId es requerido" });

        var user = await authService.GetUserByIdAsync(request.UserId);
        if (user == null)
            return NotFound(new { success = false, message = "Usuario no encontrado" });

        return Ok(new { success = true, message = "Perfil obtenido exitosamente", data = user });
    }

    // ──────────────────────────────────────────────
    //  Listado de usuarios (solo Admin)
    // ──────────────────────────────────────────────

    /// <summary>
    /// Obtiene todos los usuarios registrados en Gastreat GT.
    /// Solo accesible para ADMIN_ROLE.
    /// </summary>
    [HttpGet("users")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAllUsers()
    {
        if (!await CurrentUserIsAdmin())
            return StatusCode(403, new { success = false, message = "Forbidden" });

        var users = await authService.GetAllUsersAsync();
        return Ok(users);
    }
}
