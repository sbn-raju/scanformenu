"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getWorkspace } from "@/lib/auth/session";
import { formValues, validationError, type FormState } from "@/lib/forms";
import { canManageMenus } from "@/lib/menus/constants";
import {
  createCategory,
  createItem,
  createMenu,
  createSubcategory,
  deleteCategory,
  deleteItem,
  deleteMenu,
  deleteSubcategory,
  moveCategory,
  moveItem,
  moveSubcategory,
  setItemAvailability,
  setMenuActive,
  updateCategory,
  updateItem,
  updateMenu,
  updateSubcategory,
  type Direction,
  type ItemWriteResult,
} from "@/lib/menus/service";
import {
  createCategorySchema,
  createItemSchema,
  createSubcategorySchema,
  itemSchema,
  menuSchema,
  sectionSchema,
  uuidSchema,
} from "@/lib/menus/validation";
import { routes } from "@/lib/routes";

const NO_ACCESS = "Only owners and managers can edit menus.";
const GONE = "That no longer exists. Refresh the page and try again.";
const FAILED = "Something went wrong. Please try again.";

/** The user and property, if their role allows editing menus. */
async function requireMenuEditor() {
  const { user, activeProperty } = await getWorkspace();
  if (!activeProperty) redirect(routes.onboarding);
  if (!canManageMenus(activeProperty.role)) return null;
  return { user, property: activeProperty };
}

function isId(value: unknown): value is string {
  return uuidSchema.safeParse(value).success;
}

function itemResultMessage(result: ItemWriteResult): string | null {
  if (result === "not_found") return GONE;
  if (result === "bad_image") return "Choose an image from this property's media library.";
  return null;
}

/**
 * Runs a small mutation (delete, move, toggle) for an editor and refreshes the
 * page. `run` returns false when the target isn't in this property.
 */
async function mutate(
  id: unknown,
  run: (propertyId: string, id: string) => Promise<boolean>,
  success: string,
  label: string,
): Promise<FormState> {
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS };
  if (!isId(id)) return { status: "error", message: GONE };
  try {
    if (!(await run(editor.property.id, id))) return { status: "error", message: GONE };
  } catch (error) {
    console.error(`${label} failed`, error);
    return { status: "error", message: FAILED };
  }
  refresh();
  return { status: "success", message: success };
}

const isDirection = (value: unknown): value is Direction => value === "up" || value === "down";

// ─── Menus ──────────────────────────────────────────────────────────────────

export async function createMenuAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: "Only owners and managers can create menus.", values };

  const parsed = menuSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  let menuId: string;
  try {
    ({ id: menuId } = await createMenu(editor.property.id, editor.user.id, parsed.data));
  } catch (error) {
    console.error("createMenuAction failed", error);
    return { status: "error", message: "We couldn't create your menu. Please try again.", values };
  }
  redirect(routes.menu(menuId));
}

export async function updateMenuAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS, values };
  if (!isId(values.id)) return { status: "error", message: GONE, values };

  const parsed = menuSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  try {
    if (!(await updateMenu(editor.property.id, values.id, parsed.data))) {
      return { status: "error", message: GONE, values };
    }
  } catch (error) {
    console.error("updateMenuAction failed", error);
    return { status: "error", message: FAILED, values };
  }
  refresh();
  return { status: "success", message: "Menu saved.", values };
}

export async function setMenuActiveAction(menuId: string, isActive: boolean): Promise<FormState> {
  return mutate(
    menuId,
    (propertyId, id) => setMenuActive(propertyId, id, isActive === true),
    isActive ? "Menu is live for guests." : "Menu hidden from guests.",
    "setMenuActiveAction",
  );
}

export async function deleteMenuAction(menuId: string): Promise<FormState> {
  const result = await mutate(menuId, deleteMenu, "Menu deleted.", "deleteMenuAction");
  if (result.status === "success") redirect(routes.menus);
  return result;
}

// ─── Categories ───────────────────────────────────────────────────────────

export async function createCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS, values };

  const parsed = createCategorySchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);
  const { menuId, ...input } = parsed.data;

  try {
    if (!(await createCategory(editor.property.id, menuId, input))) {
      return { status: "error", message: GONE, values };
    }
  } catch (error) {
    console.error("createCategoryAction failed", error);
    return { status: "error", message: FAILED, values };
  }
  refresh();
  return { status: "success", message: `Category “${input.name}” added.` };
}

export async function updateCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS, values };
  if (!isId(values.id)) return { status: "error", message: GONE, values };

  const parsed = sectionSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  try {
    if (!(await updateCategory(editor.property.id, values.id, parsed.data))) {
      return { status: "error", message: GONE, values };
    }
  } catch (error) {
    console.error("updateCategoryAction failed", error);
    return { status: "error", message: FAILED, values };
  }
  refresh();
  return { status: "success", message: "Category saved.", values };
}

export async function deleteCategoryAction(categoryId: string): Promise<FormState> {
  return mutate(categoryId, deleteCategory, "Category deleted.", "deleteCategoryAction");
}

export async function moveCategoryAction(categoryId: string, direction: Direction): Promise<FormState> {
  if (!isDirection(direction)) return { status: "error", message: FAILED };
  return mutate(
    categoryId,
    (propertyId, id) => moveCategory(propertyId, id, direction),
    "Category moved.",
    "moveCategoryAction",
  );
}

// ─── Sub-categories ───────────────────────────────────────────────────────

export async function createSubcategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS, values };

  const parsed = createSubcategorySchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);
  const { categoryId, ...input } = parsed.data;

  try {
    if (!(await createSubcategory(editor.property.id, categoryId, input))) {
      return { status: "error", message: GONE, values };
    }
  } catch (error) {
    console.error("createSubcategoryAction failed", error);
    return { status: "error", message: FAILED, values };
  }
  refresh();
  return { status: "success", message: `Sub-category “${input.name}” added.` };
}

export async function updateSubcategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS, values };
  if (!isId(values.id)) return { status: "error", message: GONE, values };

  const parsed = sectionSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  try {
    if (!(await updateSubcategory(editor.property.id, values.id, parsed.data))) {
      return { status: "error", message: GONE, values };
    }
  } catch (error) {
    console.error("updateSubcategoryAction failed", error);
    return { status: "error", message: FAILED, values };
  }
  refresh();
  return { status: "success", message: "Sub-category saved.", values };
}

export async function deleteSubcategoryAction(subcategoryId: string): Promise<FormState> {
  return mutate(subcategoryId, deleteSubcategory, "Sub-category deleted.", "deleteSubcategoryAction");
}

export async function moveSubcategoryAction(subcategoryId: string, direction: Direction): Promise<FormState> {
  if (!isDirection(direction)) return { status: "error", message: FAILED };
  return mutate(
    subcategoryId,
    (propertyId, id) => moveSubcategory(propertyId, id, direction),
    "Sub-category moved.",
    "moveSubcategoryAction",
  );
}

// ─── Items ────────────────────────────────────────────────────────────────

export async function createItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS, values };

  const parsed = createItemSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);
  const { subcategoryId, ...input } = parsed.data;

  try {
    const problem = itemResultMessage(await createItem(editor.property.id, subcategoryId, input));
    if (problem) return { status: "error", message: problem, values };
  } catch (error) {
    console.error("createItemAction failed", error);
    return { status: "error", message: FAILED, values };
  }
  refresh();
  return { status: "success", message: `“${input.name}” added.` };
}

export async function updateItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const editor = await requireMenuEditor();
  if (!editor) return { status: "error", message: NO_ACCESS, values };
  if (!isId(values.id)) return { status: "error", message: GONE, values };

  const parsed = itemSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  try {
    const problem = itemResultMessage(await updateItem(editor.property.id, values.id, parsed.data));
    if (problem) return { status: "error", message: problem, values };
  } catch (error) {
    console.error("updateItemAction failed", error);
    return { status: "error", message: FAILED, values };
  }
  refresh();
  return { status: "success", message: "Item saved.", values };
}

export async function setItemAvailabilityAction(itemId: string, isAvailable: boolean): Promise<FormState> {
  return mutate(
    itemId,
    (propertyId, id) => setItemAvailability(propertyId, id, isAvailable === true),
    isAvailable ? "Item marked available." : "Item marked unavailable.",
    "setItemAvailabilityAction",
  );
}

export async function deleteItemAction(itemId: string): Promise<FormState> {
  return mutate(itemId, deleteItem, "Item deleted.", "deleteItemAction");
}

export async function moveItemAction(itemId: string, direction: Direction): Promise<FormState> {
  if (!isDirection(direction)) return { status: "error", message: FAILED };
  return mutate(
    itemId,
    (propertyId, id) => moveItem(propertyId, id, direction),
    "Item moved.",
    "moveItemAction",
  );
}
