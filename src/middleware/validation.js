const { body, param } = require('express-validator');

exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

exports.validateCreateRole = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Role name must be between 1 and 100 characters')
    .customSanitizer((value) => value.toUpperCase())
    .matches(/^[A-Z0-9._]+$/)
    .withMessage('Role name can only contain uppercase letters, numbers, underscores, and periods'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

exports.validateUpdateRole = [
  param('id')
    .isInt()
    .withMessage('Role ID must be a valid integer'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Role name must be between 1 and 100 characters')
    .customSanitizer((value) => value.toUpperCase())
    .matches(/^[A-Z0-9._]+$/)
    .withMessage('Role name can only contain uppercase letters, numbers, underscores, and periods'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

exports.validateCreatePermission = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Permission name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Permission name must be between 1 and 100 characters')
    .customSanitizer((value) => value.toUpperCase())
    .matches(/^[A-Z0-9._]+$/)
    .withMessage('Permission name can only contain uppercase letters, numbers, underscores, and periods'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

exports.validateUpdatePermission = [
  param('id')
    .isInt()
    .withMessage('Permission ID must be a valid integer'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Permission name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Permission name must be between 1 and 100 characters')
    .customSanitizer((value) => value.toUpperCase())
    .matches(/^[A-Z0-9._]+$/)
    .withMessage('Permission name can only contain uppercase letters, numbers, underscores, and periods'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

exports.validateAssignRolesToUser = [
  param('userId')
    .isInt()
    .withMessage('User ID must be a valid integer'),
  body('roleIds')
    .isArray()
    .withMessage('Role IDs must be an array')
    .notEmpty()
    .withMessage('At least one role ID is required'),
  body('roleIds.*')
    .isInt()
    .withMessage('Each role ID must be a valid integer')
];

exports.validateAssignPermissionsToRole = [
  param('roleId')
    .isInt()
    .withMessage('Role ID must be a valid integer'),
  body('permissionIds')
    .isArray()
    .withMessage('Permission IDs must be an array'),
  body('permissionIds.*')
    .isInt()
    .withMessage('Each permission ID must be a valid integer')
];

exports.validateCreateUser = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
];

exports.validateUpdateUser = [
  param('id')
    .isInt()
    .withMessage('User ID must be a valid integer'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
];

exports.validateSetPassword = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

exports.validateResendPasswordSetEmail = [
  param('id')
    .isInt()
    .withMessage('User ID must be a valid integer')
];
