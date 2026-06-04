using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

/// <summary>
/// Contrato para el manejo de refresh tokens en Gastreat GT.
/// Implementa rotación de tokens para mayor seguridad:
/// cada vez que se usa un refresh token, se revoca y se emite uno nuevo.
/// </summary>
public interface IRefreshTokenService
{
    /// <summary>
    /// Valida el refresh token recibido, lo revoca y genera un nuevo par
    /// JWT + refresh token (rotación de tokens).
    /// </summary>
    /// <param name="refreshToken">Refresh token activo del usuario.</param>
    /// <returns>Nuevo JWT y nuevo refresh token.</returns>
    /// <exception cref="UnauthorizedAccessException">Si el token es inválido, expirado o ya fue revocado.</exception>
    Task<AuthResponseDto> RotateAsync(string refreshToken);

    /// <summary>
    /// Revoca el refresh token, cerrando la sesión del usuario.
    /// </summary>
    /// <param name="refreshToken">Refresh token a revocar.</param>
    /// <exception cref="UnauthorizedAccessException">Si el token no existe o ya fue revocado.</exception>
    Task RevokeAsync(string refreshToken);

    /// <summary>
    /// Genera y persiste un nuevo refresh token asociado a un usuario.
    /// Usado internamente al momento del login y la rotación.
    /// </summary>
    /// <param name="userId">ID del usuario al que pertenece el token.</param>
    /// <returns>Refresh token generado.</returns>
    Task<string> GenerateAsync(string userId);

    /// <summary>
    /// Revoca todos los refresh tokens activos de un usuario.
    /// Útil para forzar cierre de sesión en todos los dispositivos.
    /// Solo accesible para ADMIN_ROLE.
    /// </summary>
    /// <param name="userId">ID del usuario cuyos tokens serán revocados.</param>
    Task RevokeAllAsync(string userId);
}
