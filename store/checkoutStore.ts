// store/checkoutStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DeliveryType = 'office' | 'address' | 'econtomat';

export interface CheckoutFormData {
  notes: string;
  firstName: string;
  lastName: string;
  telephone: string;
  email: string;
  country: string;
  city: string;
  deliveryType: DeliveryType;
}

export interface CityOption {
  name: string;
  postcode: string;
  displayName: string;
}

export interface CheckoutState {
  formData: CheckoutFormData;
  cities: CityOption[];
  isSubmitting: boolean;
  isValidatingStock: boolean;
  error: string | null;
  insufficientStock: any[];

  // Actions
  updateFormData: (data: Partial<CheckoutFormData>) => void;
  setCities: (cities: CityOption[]) => void;
  setSubmitting: (submitting: boolean) => void;
  setValidatingStock: (validating: boolean) => void;
  setError: (error: string | null) => void;
  setInsufficientStock: (stock: any[]) => void;
  resetForm: () => void;

  // Computed
  isFormValid: () => boolean;
  fullName: () => string;
}

const defaultFormData: CheckoutFormData = {
  notes: '',
  firstName: '',
  lastName: '',
  telephone: '',
  email: '',
  country: 'Bulgaria',
  city: '',
  deliveryType: 'office',
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      formData: defaultFormData,
      cities: [],
      isSubmitting: false,
      isValidatingStock: false,
      error: null,
      insufficientStock: [],

      updateFormData: (data) => {
        set(state => ({
          formData: { ...state.formData, ...data }
        }));
      },

      setCities: (cities) => {
        set({ cities });
      },

      setSubmitting: (submitting) => {
        set({ isSubmitting: submitting });
      },

      setValidatingStock: (validating) => {
        set({ isValidatingStock: validating });
      },

      setError: (error) => {
        set({ error });
      },

      setInsufficientStock: (stock) => {
        set({ insufficientStock: stock });
      },

      resetForm: () => {
        set({
          formData: defaultFormData,
          error: null,
          isSubmitting: false,
          isValidatingStock: false,
          insufficientStock: []
        });
      },

      isFormValid: () => {
        const { formData } = get();
        return !!(
          formData.firstName.trim() &&
          formData.lastName.trim() &&
          formData.telephone.trim() &&
          formData.email.trim() &&
          formData.city &&
          formData.deliveryType
        );
      },

      fullName: () => {
        const { formData } = get();
        return `${formData.firstName} ${formData.lastName}`.trim();
      }
    }),
    {
      name: 'checkout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        formData: state.formData,
        cities: state.cities
      }), // Persist form data and cities
    }
  )
);
