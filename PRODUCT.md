# Advisor

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students build semester plans and discuss them with their advisor. Advisors review plans and manage availability.
Deans and the VP inspect permitted aggregates. Admins manage operational configuration.

## Product Purpose

Advisor helps students understand their academic record and prepare one official semester plan.
An advisor approves or returns the plan. Students register approved plans manually in the SIS.

## Capabilities and Constraints

Product authority remains in `docs/product/01-PRODUCT-FOUNDATION.md` and the other files in `docs/product/`.
The AI serves students only. It never silently submits a plan or overrides academic rules.
The SIS supplies academic records. The frontend never writes to the SIS.
The redesign preserves role permissions and academic functions. It removes the blocking chat goal screen.
New chats use the existing `maintain` goal internally, as confirmed by the user on 2026-10-09.
Model selection and voice recording remain out of scope.

## Brand Commitments

The product name is Advisor. The user retains crimson and replaces the existing visual style with the supplied references.
Navigation and global controls belong in the sidebar. The interface has no topbar or bottom navigation.

## Accessibility & Inclusion

Preserve English, Arabic, RTL, light and dark themes, keyboard access, visible focus, and reduced-motion support.
Hover interactions must also work through focus or touch.

## Evidence on Hand

The repository contains product contracts, seeded demonstration data, and existing workflows.
Production API validation remains separate from local mock verification.
