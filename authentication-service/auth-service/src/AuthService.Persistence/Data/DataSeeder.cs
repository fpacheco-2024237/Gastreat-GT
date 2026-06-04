using System;
using AuthService.Domain.Entities;
using AuthService.Domain.Constants;
using Microsoft.EntityFrameworkCore;
using AuthService.Application.Services;

namespace AuthService.Persistence.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if(!context.Roles.Any())
        {
            var roles = new List<Role>
            {
                new()
                {
                    Id = UuidGenerator.GenerateRoleId(),
                    Name = RoleConstants.ADMIN_ROLE
                },
                new()
                {
                    Id = UuidGenerator.GenerateRoleId(),
                    Name = RoleConstants.USER_ROLE
                }
            };

            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
        }

        if(!await context.Users.AnyAsync())
        {
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == RoleConstants.ADMIN_ROLE);
            if(adminRole != null)
            {
                var passwordHasher = new PasswordHashService();
                var userId = UuidGenerator.GenerateUserId();
                var profileId = UuidGenerator.GenerateUserId();
                var emailId = UuidGenerator.GenerateUserId();
                var userRoleId =UuidGenerator.GenerateUserId();

                var adminUser = new User
                {
                    Id = userId,
                    Name = "Admin User",
                    Surname ="Admin Surname",
                    Username = "admin",
                    Email = "gstadmin@local.com",
                    Password = passwordHasher.HashPassword("GT123!"),
                    Status = true,

                    UserProfile = new UserProfile
                    {
                        Id = profileId,
                        UserId = userId,
                        ProfilePicture = string.Empty,
                        Phone = "00000000"
                    },

                    UserEmail = new UserEmail
                    {
                        Id = emailId,
                        UserId = userId,
                        EmailVerified = true,
                        EmailVerificationToken = null,
                        EmailVerificationTokenExpiry = null
                    },

                    UserRoles =
                    [
                        new UserRole
                        {
                            Id = userRoleId,
                            UserId = userId,
                            RoleId = adminRole.Id
                        }
                    ]
                };
                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }
        }
        else
        {
            // Forzar actualización de contraseña en caso de que la DB tenga una vieja
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            if (adminUser != null)
            {
                var passwordHasher = new PasswordHashService();
                adminUser.Password = passwordHasher.HashPassword("GT123!");
                await context.SaveChangesAsync();
            }
        }
    }
}
