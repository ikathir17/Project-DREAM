import React, { useState } from 'react';
import { Field, ErrorMessage } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import './FormField.css';

const FormField = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  helpText,
  icon: Icon,
  options = [],
  rows = 3,
  accept,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderField = ({ field, form, meta }) => {
    const hasError = meta.touched && meta.error;
    const hasValue = field.value && field.value.toString().length > 0;
    const isValid = meta.touched && !meta.error && hasValue;

    const fieldClasses = `
      form-field-input
      ${hasError ? 'error' : ''}
      ${isValid ? 'valid' : ''}
      ${isFocused ? 'focused' : ''}
      ${hasValue ? 'has-value' : ''}
      ${className}
    `.trim();

    const commonProps = {
      ...field,
      ...props,
      className: fieldClasses,
      onFocus: (e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        field.onBlur(e);
        props.onBlur?.(e);
      }
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            placeholder={placeholder}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="checkbox-group">
            {options.map((option) => (
              <motion.label 
                key={option.value} 
                className="checkbox-item"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="checkbox"
                  name={field.name}
                  value={option.value}
                  checked={field.value?.includes(option.value)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const currentValues = field.value || [];
                    if (e.target.checked) {
                      form.setFieldValue(field.name, [...currentValues, value]);
                    } else {
                      form.setFieldValue(
                        field.name,
                        currentValues.filter((v) => v !== value)
                      );
                    }
                  }}
                  className="checkbox-input"
                />
                <span className="checkbox-custom">
                  <CheckCircle size={14} />
                </span>
                <span className="checkbox-label">{option.label}</span>
              </motion.label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="file-input-wrapper">
            <input
              {...commonProps}
              type="file"
              accept={accept}
              className="file-input-hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                form.setFieldValue(field.name, file);
                props.onChange?.(e);
              }}
            />
            <motion.label 
              htmlFor={field.name}
              className="file-input-label"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {Icon && <Icon size={18} />}
              {hasValue ? field.value.name : (placeholder || `Choose ${label}`)}
            </motion.label>
          </div>
        );

      case 'password':
        return (
          <div className="password-input-wrapper">
            <input
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
              placeholder={placeholder}
            />
            <motion.button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.button>
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <motion.div 
      className="form-field-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="form-field-container">
        {label && (
          <motion.label 
            htmlFor={name} 
            className={`form-field-label ${required ? 'required' : ''}`}
            animate={{ 
              color: isFocused ? 'var(--primary-600)' : 'var(--gray-700)',
              scale: isFocused ? 1.02 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            {Icon && <Icon size={16} className="label-icon" />}
            {label}
            {required && <span className="required-asterisk">*</span>}
          </motion.label>
        )}

        <div className="form-field-input-container">
          <Field name={name}>
            {renderField}
          </Field>

          <AnimatePresence>
            <ErrorMessage name={name}>
              {(msg) => (
                <motion.div
                  className="form-field-error"
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle size={14} />
                  {msg}
                </motion.div>
              )}
            </ErrorMessage>
          </AnimatePresence>
        </div>

        {helpText && (
          <motion.div 
            className="form-field-help"
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused ? 1 : 0.7 }}
            transition={{ duration: 0.2 }}
          >
            <Info size={14} />
            {helpText}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FormField;
