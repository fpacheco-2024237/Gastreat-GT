using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Services;

public class RefreshTokenService(
    IUserRepository userRepository,
    IJwtTokenService jwtTokenService,
    IConfiguration configuration,
    ICloudinaryService cloudinaryService) : IRefreshTokenService
{
    // Almacenamiento en memoria para tokens (en producción usar Redis o base de datos)
    private static readonly Dictionary<string, string> _refreshTokens = new();

    public Task<string> GenerateAsync(string userId)
    {
        var token = Guid.NewGuid().ToString("N");
        _refreshTokens[token] = userId;
        return Task.FromResult(token);
    }

    public async Task<AuthResponseDto> RotateAsync(string refreshToken)
    {
        if (!_refreshTokens.TryGetValue(refreshToken, out var userId))
        {
            throw new UnauthorizedAccessException("Refresh token inválido o expirado");
        }

        // Revocamos el token usado (rotación)
        _refreshTokens.Remove(refreshToken);

        // Verificamos el usuario
        var user = await userRepository.GetByIdAsync(userId);
        if (user == null || !user.Status)
        {
            throw new UnauthorizedAccessException("Usuario no válido o inactivo");
        }

        // Generamos nuevos tokens
        var newJwt = jwtTokenService.GenerateToken(user);
        var newRefreshToken = await GenerateAsync(userId);
        var expiryMinutes = int.Parse(configuration["JwtSettings:ExpiryInMinutes"] ?? "30");

        return new AuthResponseDto
        {
            Success = true,
            Message = "Token refrescado exitosamente",
            AccessToken = newJwt,
            RefreshToken = newRefreshToken,
            User = new UserDetailsDto
            {
                Id = user.Id,
                Username = user.Username,
                ProfilePicture = cloudinaryService.GetFullImageUrl(user.UserProfile?.ProfilePicture ?? string.Empty),
                Role = user.UserRoles.FirstOrDefault()?.Role?.Name ?? RoleConstants.USER_ROLE
            },
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };
    }

    public Task RevokeAsync(string refreshToken)
    {
        _refreshTokens.Remove(refreshToken);
        return Task.CompletedTask;
    }

    public Task RevokeAllAsync(string userId)
    {
        var tokensToRemove = _refreshTokens.Where(kv => kv.Value == userId).Select(kv => kv.Key).ToList();
        foreach (var t in tokensToRemove)
        {
            _refreshTokens.Remove(t);
        }
        return Task.CompletedTask;
    }
}
