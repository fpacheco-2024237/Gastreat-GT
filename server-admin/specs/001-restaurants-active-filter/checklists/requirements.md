# Requirements Checklist: Refuerzo del filtrado de restaurantes inactivos

**Purpose**: Validar que los requisitos del feature definan claramente la lógica de estado activo, los datos fiscales/horario, la autorización ADMIN vs USER y el comportamiento de listados por status.
**Created**: 2026-07-17
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [x] CHK001 Are the rules for default visibility of inactive restaurants explicitly defined for non-admin users? [Completeness, Spec §FR-001]
- [x] CHK002 Are the administrative exceptions for including inactive restaurants explicitly documented and restricted to ADMIN_ROLE? [Completeness, Spec §FR-002]
- [x] CHK003 Are the required fiscal fields and the business rules for them clearly specified for restaurant creation and update? [Completeness, Spec §FR-001]
- [x] CHK004 Are the opening/closing time requirements for the restaurant schedule documented for all relevant days? [Completeness, Spec §FR-001]

## Requirement Clarity

- [x] CHK005 Is the meaning of "activo" versus "inactivo" unambiguous for list, detail, and write operations? [Clarity, Spec §FR-001]
- [x] CHK006 Is the behavior of `GET /restaurants?includeInactive=true` explicitly defined for admins and non-admins? [Clarity, Spec §FR-002]
- [x] CHK007 Are the expected HTTP responses for inactive restaurant access and dependent-resource validation clearly specified? [Clarity, Spec §FR-003, FR-006]
- [x] CHK008 Are the validation rules for fiscal data and schedule format precise enough to be implemented without ambiguity? [Clarity, Spec §FR-001]

## Requirement Consistency

- [x] CHK009 Do the visibility rules for list and detail endpoints align with the same concept of active/inactive status? [Consistency, Spec §FR-001, FR-003]
- [x] CHK010 Are the authorization rules for ADMIN vs USER consistent across listing, detail, and dependent-service operations? [Consistency, Spec §FR-002, FR-004, FR-005]
- [x] CHK011 Do the requirements avoid conflicting behavior between default exclusion and explicit admin opt-in? [Consistency, Spec §FR-001, FR-002]

## Acceptance Criteria Quality

- [x] CHK012 Can the success criteria for default listing behavior be objectively measured? [Acceptance Criteria, SC-001]
- [x] CHK013 Can the success criteria for admin opt-in visibility and non-admin privacy be objectively verified? [Acceptance Criteria, SC-002, SC-003]
- [x] CHK014 Are the failure conditions for dependent-service writes measurable and unambiguous? [Acceptance Criteria, SC-004]

## Scenario Coverage

- [x] CHK015 Are primary, alternate, and exception flows covered for active and inactive restaurants? [Coverage, Spec §FR-001, FR-003, FR-006]
- [x] CHK016 Are edge cases for schedule validation, missing fiscal data, and inactive restaurant references explicitly addressed? [Coverage, Edge Case]
- [x] CHK017 Are requirements defined for the case where a restaurant is inactive but an admin wants to audit or reactivate it? [Coverage, Gap]

## Dependencies and Assumptions

- [x] CHK018 Are the assumptions about existing auth roles and the admin context documented clearly? [Assumption]
- [x] CHK019 Are the dependency boundaries between restaurants and dependent services explicitly defined? [Dependency, Spec §FR-005]
- [x] CHK020 Is the expectation that inactive restaurants are hidden by default but still accessible for admin review documented as a business rule? [Assumption, Spec §FR-001, FR-002]

## Notes

- Check items off as completed: `[x]`
- Add findings or clarifications inline when a requirement gap is identified.
