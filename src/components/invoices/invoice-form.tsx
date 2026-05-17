"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoiceSchema } from "@/schemas/invoice";
import { ClientData } from "@/types/client";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  clients: ClientData[];
  defaultValues?: Partial<InvoiceFormData>;
  isEditing?: boolean;
  invoiceId?: string;
}

export function InvoiceForm({
  clients,
  defaultValues,
  isEditing = false,
  invoiceId,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: "",
      title: "",
      invoiceNumber: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      paymentTerms: "net30",
      lineItems: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      taxRate: 0,
      discountPercent: 0,
      notes: "",
      internalNotes: "",
      reminderEnabled: true,
      reminderFirstAfterDays: 7,
      reminderFrequencyDays: 7,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const lineItems = watch("lineItems");
  const taxRate = watch("taxRate") || 0;
  const discountPercent = watch("discountPercent") || 0;

  const subtotal = lineItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  const updateLineItemAmount = useCallback(
    (index: number, quantity: number, rate: number) => {
      const amount = quantity * rate;
      setValue(`lineItems.${index}.amount`, amount, { shouldValidate: false });
    },
    [setValue]
  );

  const generateInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `INV-${year}-${timestamp}`;
  }, []);

  useEffect(() => {
    if (!defaultValues?.invoiceNumber) {
      setValue("invoiceNumber", generateInvoiceNumber());
    }
  }, [generateInvoiceNumber, setValue, defaultValues]);

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const url = isEditing && invoiceId
        ? `/api/invoices/${invoiceId}`
        : "/api/invoices";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to save invoice");
        return;
      }

      toast.success(isEditing ? "Invoice updated" : "Invoice created");
      router.push(`/app/invoices/${result.id}`);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Client & Invoice Info */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Client */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">
                Client <span className="text-destructive">*</span>
              </label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                          {client.company ? ` — ${client.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Invoice Title <span className="text-destructive">*</span>
              </label>
              <Input {...register("title")} placeholder="Website Development" />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Invoice Number <span className="text-destructive">*</span>
              </label>
              <Input {...register("invoiceNumber")} placeholder="INV-2024-001" />
              {errors.invoiceNumber && (
                <p className="text-sm text-destructive">{errors.invoiceNumber.message}</p>
              )}
            </div>

            {/* Issue Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Issue Date <span className="text-destructive">*</span>
              </label>
              <Input type="date" {...register("issueDate")} />
              {errors.issueDate && (
                <p className="text-sm text-destructive">{errors.issueDate.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Due Date <span className="text-destructive">*</span>
              </label>
              <Input type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Payment Terms <span className="text-destructive">*</span>
              </label>
              <Controller
                name="paymentTerms"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentTerms && (
                <p className="text-sm text-destructive">{errors.paymentTerms.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ description: "", quantity: 1, rate: 0, amount: 0 })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header */}
          <div className="hidden grid-cols-12 gap-4 text-sm font-medium text-muted-foreground md:grid">
            <div className="col-span-1" />
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1" />
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-4 md:grid-cols-12 md:items-center"
            >
              {/* Drag handle */}
              <div className="hidden text-muted-foreground md:flex md:col-span-1 md:justify-center">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Description */}
              <div className="md:col-span-4">
                <label className="text-xs font-medium text-muted-foreground md:hidden">
                  Description
                </label>
                <Input
                  {...register(`lineItems.${index}.description`)}
                  placeholder="Item description"
                  className="mt-1 md:mt-0"
                />
                {errors.lineItems?.[index]?.description && (
                  <p className="text-sm text-destructive">
                    {errors.lineItems[index]?.description?.message}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-1">
                <div>
                  <label className="text-xs font-medium text-muted-foreground md:hidden">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    {...register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const qty = parseFloat(e.target.value) || 0;
                        const rate = lineItems?.[index]?.rate || 0;
                        updateLineItemAmount(index, qty, rate);
                      },
                    })}
                    placeholder="1"
                    className="mt-1 md:mt-0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground md:hidden">
                    Rate
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`lineItems.${index}.rate`, {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const qty = lineItems?.[index]?.quantity || 0;
                        const rate = parseFloat(e.target.value) || 0;
                        updateLineItemAmount(index, qty, rate);
                      },
                    })}
                    placeholder="0.00"
                    className="mt-1 md:mt-0"
                  />
                </div>
              </div>

              {/* Amount (read-only) */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground md:hidden">
                  Amount
                </label>
                <div className="mt-1 flex h-10 items-center justify-end rounded-md border bg-muted/50 px-3 text-sm font-medium md:mt-0">
                  {formatCurrency(lineItems?.[index]?.amount || 0)}
                </div>
              </div>

              {/* Remove */}
              <div className="flex justify-end md:col-span-1 md:justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-destructive"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {errors.lineItems && (
            <p className="text-sm text-destructive">{errors.lineItems.message || errors.lineItems.root?.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Tax & Discount */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tax & Discount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register("taxRate", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.taxRate && (
                <p className="text-sm text-destructive">{errors.taxRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register("discountPercent", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.discountPercent && (
                <p className="text-sm text-destructive">{errors.discountPercent.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Discount ({discountPercent}%)
                </span>
                <span className="text-destructive">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({taxRate}%)
                </span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes to Client</label>
            <Textarea
              {...register("notes")}
              placeholder="Thank you for your business!"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Internal Notes</label>
            <Textarea
              {...register("internalNotes")}
              placeholder="Internal notes (not visible to client)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reminderEnabled"
              {...register("reminderEnabled")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="reminderEnabled" className="text-sm font-medium">
              Enable automatic reminders
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                First reminder after (days)
              </label>
              <Input
                type="number"
                min="1"
                {...register("reminderFirstAfterDays", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Repeat every (days)
              </label>
              <Input
                type="number"
                min="1"
                {...register("reminderFrequencyDays", { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
