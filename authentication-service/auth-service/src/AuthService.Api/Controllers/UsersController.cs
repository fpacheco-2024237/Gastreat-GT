using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class UsersController(IUserManagementService userManagementService) : ControllerBase
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
    //  Gestión de roles
    // ──────────────────────────────────────────────

    /// <summary>
    /// Asigna ADMIN_ROLE o USER_ROLE a un usuario de Gastreat GT.
    /// Solo accesible para ADMIN_ROLE.
    /// </summary>
    [HttpPut("{userId}/role")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<UserResponseDto>> UpdateUserRole(
        string userId,
        [FromBody] UpdateUserRoleDto dto)
    {
        if (!await CurrentUserIsAdmin())
            return StatusCode(403, new { success = false, message = "Forbidden" });

        var result = await userManagementService.UpdateUserRoleAsync(userId, dto.RoleName);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene los roles asignados a un usuario.
    /// Accesible para cualquier usuario autenticado.
    /// </summary>
    [HttpGet("{userId}/roles")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<string>>> GetUserRoles(string userId)
    {
        var roles = await userManagementService.GetUserRolesAsync(userId);
        return Ok(roles);
    }

    /// <summary>
    /// Lista todos los usuarios que tienen un rol específico.
    /// Ejemplos: /users/by-role/ADMIN_ROLE  |  /users/by-role/USER_ROLE
    /// Solo accesible para ADMIN_ROLE.
    /// </summary>
    [HttpGet("by-role/{roleName}")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<IReadOnlyList<UserResponseDto>>> GetUsersByRole(string roleName)
    {
        if (!await CurrentUserIsAdmin())
            return StatusCode(403, new { success = false, message = "Forbidden" });

        var validRoles = new[] { RoleConstants.ADMIN_ROLE, RoleConstants.USER_ROLE };
        if (!validRoles.Contains(roleName))
        {
            return BadRequest(new
            {
                success = false,
                message = $"Rol no válido. Roles permitidos: {string.Join(", ", validRoles)}"
            });
        }

        var users = await userManagementService.GetUsersByRoleAsync(roleName);
        return Ok(users);
    }
}
